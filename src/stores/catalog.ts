import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Competency, LessonTemplate } from '@/types'
import { supabase } from '@/lib/supabase'
import { competencyToRow, templateToRow, toCompetency, toTemplate } from '@/lib/mappers'

export type CompetencyDraft = Omit<Competency, 'id'>
export type TemplateDraft = Omit<LessonTemplate, 'id' | 'usageCount'>

/** MELC data and lesson templates: maintained by the admin, consumed by the teacher. */
export const useCatalogStore = defineStore('catalog', () => {
  const competencies = ref<Competency[]>([])
  const templates = ref<LessonTemplate[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    const [competencyResult, templateResult] = await Promise.all([
      supabase.from('competencies').select('*').order('quarter').order('code'),
      supabase.from('lesson_templates').select('*').order('name'),
    ])
    if (competencyResult.error || templateResult.error) {
      error.value = competencyResult.error?.message ?? templateResult.error?.message ?? 'Load failed.'
    } else {
      competencies.value = competencyResult.data.map(toCompetency)
      templates.value = templateResult.data.map(toTemplate)
    }
    loading.value = false
  }

  async function refetchTemplates() {
    const { data } = await supabase.from('lesson_templates').select('*').order('name')
    if (data) templates.value = data.map(toTemplate)
  }

  const activeCompetencies = computed(() => competencies.value.filter((c) => c.active))
  const activeTemplates = computed(() => templates.value.filter((t) => t.active))
  const defaultTemplate = computed(
    () => activeTemplates.value.find((t) => t.isDefault) ?? activeTemplates.value[0] ?? null,
  )

  const domains = computed(() => [...new Set(competencies.value.map((c) => c.domain))].sort())

  function competencyById(id: string) {
    return competencies.value.find((c) => c.id === id) ?? null
  }

  function templateById(id: string) {
    return templates.value.find((t) => t.id === id) ?? null
  }

  function competenciesFor(grade: string, quarter?: number) {
    return activeCompetencies.value.filter(
      (c) => c.grade === grade && (quarter === undefined || c.quarter === quarter),
    )
  }

  async function addCompetency(draft: CompetencyDraft) {
    const { data, error: insertError } = await supabase
      .from('competencies')
      .insert(competencyToRow(draft))
      .select()
      .single()
    if (insertError || !data) throw new Error(insertError?.message ?? 'Could not add the competency.')
    const item = toCompetency(data)
    competencies.value = [item, ...competencies.value]
    return item
  }

  async function updateCompetency(id: string, patch: Partial<Competency>) {
    const { data, error: updateError } = await supabase
      .from('competencies')
      .update({
        code: patch.code,
        grade: patch.grade,
        quarter: patch.quarter,
        domain: patch.domain,
        description: patch.description,
        active: patch.active,
      })
      .eq('id', id)
      .select()
      .single()
    if (updateError || !data) throw new Error(updateError?.message ?? 'Could not save the competency.')
    competencies.value = competencies.value.map((c) => (c.id === id ? toCompetency(data) : c))
  }

  async function removeCompetency(id: string) {
    const { error: deleteError } = await supabase.from('competencies').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    competencies.value = competencies.value.filter((c) => c.id !== id)
  }

  async function addTemplate(draft: TemplateDraft) {
    const { data, error: insertError } = await supabase
      .from('lesson_templates')
      .insert(templateToRow(draft))
      .select()
      .single()
    if (insertError || !data) throw new Error(insertError?.message ?? 'Could not add the template.')
    await refetchTemplates()
    return toTemplate(data)
  }

  async function updateTemplate(id: string, patch: Partial<LessonTemplate>) {
    const { error: updateError } = await supabase
      .from('lesson_templates')
      .update({
        name: patch.name,
        approach: patch.approach,
        description: patch.description,
        sections: patch.sections,
        active: patch.active,
        is_default: patch.isDefault,
      })
      .eq('id', id)
    if (updateError) throw new Error(updateError.message)
    await refetchTemplates()
  }

  async function makeDefault(id: string) {
    const { error: rpcError } = await supabase.rpc('set_default_template', { p_template_id: id })
    if (rpcError) throw new Error(rpcError.message)
    await refetchTemplates()
  }

  async function removeTemplate(id: string) {
    const { error: deleteError } = await supabase.from('lesson_templates').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  return {
    competencies,
    templates,
    loading,
    error,
    fetchAll,
    activeCompetencies,
    activeTemplates,
    defaultTemplate,
    domains,
    competencyById,
    templateById,
    competenciesFor,
    addCompetency,
    updateCompetency,
    removeCompetency,
    addTemplate,
    updateTemplate,
    makeDefault,
    removeTemplate,
  }
})
