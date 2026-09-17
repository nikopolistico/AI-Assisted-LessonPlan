import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LessonPlan, LessonRequest } from '@/types'
import { supabase } from '@/lib/supabase'
import { planPatchToRow, toPlan } from '@/lib/mappers'
import { composeLessonPlan } from '@/lib/openai'
import { useCatalogStore } from '@/stores/catalog'

export const usePlansStore = defineStore('plans', () => {
  const all = ref<LessonPlan[]>([])
  const loading = ref(false)
  const generating = ref(false)
  const error = ref('')
  /** Held in memory between the generate screen and the preview screen. */
  const lastRequest = ref<LessonRequest | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = ''
    const { data, error: fetchError } = await supabase
      .from('lesson_plans')
      .select('*')
      .order('updated_at', { ascending: false })
    if (fetchError) error.value = fetchError.message
    else all.value = data.map(toPlan)
    loading.value = false
  }

  function forOwner(ownerId: string) {
    return all.value
      .filter((p) => p.ownerId === ownerId)
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function byId(id: string) {
    return all.value.find((p) => p.id === id) ?? null
  }

  async function generate(
    request: LessonRequest,
    _ownerId: string,
    onChunk?: (full: string) => void,
  ) {
    generating.value = true
    lastRequest.value = request
    try {
      const catalog = useCatalogStore()
      const competency = catalog.competencyById(request.competencyId)
      const template = catalog.templateById(request.templateId)
      if (!competency) throw new Error('The selected competency could not be found.')
      if (!template) throw new Error('The selected template could not be found.')

      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error('You need to be signed in to generate a plan.')

      const content = await composeLessonPlan({ request, competency, template }, onChunk)
      const remarks = [
        request.notes.trim(),
        request.learners.trim() && `Learner considerations: ${request.learners.trim()}`,
      ]
        .filter(Boolean)
        .join('\n')

      const { data, error: insertError } = await supabase
        .from('lesson_plans')
        .insert({
          owner_id: auth.user.id,
          title: content.title,
          topic: request.topic.trim(),
          competency_id: competency.id || null,
          competency_code: competency.code,
          grade: request.grade,
          quarter: request.quarter,
          duration_minutes: request.duration,
          template_id: template.id || null,
          template_name: template.name,
          status: 'draft',
          objectives: content.objectives,
          materials: content.materials,
          sections: content.sections,
          assessment: content.assessment,
          assignment: content.assignment,
          remarks,
          generation_count: 1,
        })
        .select()
        .single()
      if (insertError || !data) throw new Error(insertError?.message ?? 'The plan could not be saved.')

      if (template.id) {
        await supabase.rpc('increment_template_usage', { p_template_id: template.id })
      }

      const plan = toPlan(data)
      all.value = [plan, ...all.value.filter((p) => p.id !== plan.id)]
      return plan
    } finally {
      generating.value = false
    }
  }

  async function regenerate(id: string, onChunk?: (full: string) => void) {
    generating.value = true
    try {
      const source = byId(id)
      if (!source) throw new Error('The plan could not be found.')

      const catalog = useCatalogStore()
      const competency = catalog.competencyById(source.competencyId)
      const template = catalog.templateById(source.templateId)
      if (!competency) throw new Error('The plan’s competency is no longer available.')
      if (!template) throw new Error('The plan’s template is no longer available.')

      const attempt = source.generationCount + 1
      const content = await composeLessonPlan({
        request: {
          topic: source.topic,
          competencyId: source.competencyId,
          grade: source.grade,
          quarter: source.quarter,
          duration: source.duration,
          templateId: source.templateId,
          learners: '',
          notes: source.remarks,
        },
        competency,
        template,
        attempt,
      }, onChunk)

      const { data, error: updateError } = await supabase
        .from('lesson_plans')
        .update({
          title: content.title,
          objectives: content.objectives,
          materials: content.materials,
          sections: content.sections,
          assessment: content.assessment,
          assignment: content.assignment,
          generation_count: attempt,
        })
        .eq('id', id)
        .select()
        .single()
      if (updateError || !data)
        throw new Error(updateError?.message ?? 'The plan could not be regenerated.')

      const fresh = toPlan(data)
      all.value = all.value.map((p) => (p.id === id ? fresh : p))
      return fresh
    } finally {
      generating.value = false
    }
  }

  async function update(id: string, patch: Partial<LessonPlan>) {
    const { data, error: updateError } = await supabase
      .from('lesson_plans')
      .update(planPatchToRow(patch))
      .eq('id', id)
      .select()
      .single()
    if (updateError || !data) throw new Error(updateError?.message ?? 'The plan could not be saved.')
    const saved = toPlan(data)
    all.value = all.value.map((p) => (p.id === id ? saved : p))
    return saved
  }

  async function remove(id: string) {
    const { error: deleteError } = await supabase.from('lesson_plans').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    all.value = all.value.filter((p) => p.id !== id)
  }

  async function duplicate(id: string) {
    const source = byId(id)
    if (!source) return null
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('You need to be signed in to copy a plan.')

    const { data, error: insertError } = await supabase
      .from('lesson_plans')
      .insert({
        owner_id: auth.user.id,
        title: `${source.title} (copy)`,
        topic: source.topic,
        competency_id: source.competencyId || null,
        competency_code: source.competencyCode,
        grade: source.grade,
        quarter: source.quarter,
        duration_minutes: source.duration,
        template_id: source.templateId || null,
        template_name: source.templateName,
        status: 'draft',
        objectives: source.objectives,
        materials: source.materials,
        sections: source.sections,
        assessment: source.assessment,
        assignment: source.assignment,
        remarks: source.remarks,
        generation_count: source.generationCount,
      })
      .select()
      .single()
    if (insertError || !data) throw new Error(insertError?.message ?? 'The plan could not be copied.')
    const copy = toPlan(data)
    all.value = [copy, ...all.value]
    return copy
  }

  const totalPlans = computed(() => all.value.length)
  const finalCount = computed(() => all.value.filter((p) => p.status === 'final').length)
  const draftCount = computed(() => all.value.filter((p) => p.status === 'draft').length)
  const totalGenerations = computed(() => all.value.reduce((sum, p) => sum + p.generationCount, 0))

  return {
    all,
    loading,
    generating,
    error,
    lastRequest,
    totalPlans,
    finalCount,
    draftCount,
    totalGenerations,
    fetchAll,
    forOwner,
    byId,
    generate,
    regenerate,
    update,
    remove,
    duplicate,
  }
})
