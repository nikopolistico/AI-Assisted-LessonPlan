import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { LessonPlan, LessonRequest } from '@/types'
import { seedPlans } from '@/data/seed'
import { loadState, saveState } from '@/lib/persist'
import { generatePlan } from '@/lib/generator'
import { useCatalogStore } from './catalog'

const KEY = 'alp.plans'

export const usePlansStore = defineStore('plans', () => {
  const all = ref<LessonPlan[]>(loadState<LessonPlan[]>(KEY, seedPlans))
  const generating = ref(false)
  /** Held in memory between the generate screen and the preview screen. */
  const lastRequest = ref<LessonRequest | null>(null)

  watch(all, (value) => saveState(KEY, value), { deep: true })

  const catalog = useCatalogStore()

  function forOwner(ownerId: string) {
    return all.value
      .filter((p) => p.ownerId === ownerId)
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function byId(id: string) {
    return all.value.find((p) => p.id === id) ?? null
  }

  async function generate(request: LessonRequest, ownerId: string) {
    const competency = catalog.competencyById(request.competencyId)
    const template = catalog.templateById(request.templateId)
    if (!competency || !template) throw new Error('Select a competency and a template first.')

    generating.value = true
    lastRequest.value = request
    try {
      const plan = await generatePlan({ request, competency, template, ownerId })
      all.value = [plan, ...all.value]
      catalog.noteTemplateUse(template.id)
      return plan
    } finally {
      generating.value = false
    }
  }

  async function regenerate(id: string) {
    const existing = byId(id)
    if (!existing) throw new Error('Lesson plan not found.')
    const competency = catalog.competencyById(existing.competencyId)
    const template = catalog.templateById(existing.templateId)
    if (!competency || !template)
      throw new Error('The source competency or template is no longer available.')

    generating.value = true
    try {
      const request: LessonRequest = {
        topic: existing.topic,
        competencyId: existing.competencyId,
        grade: existing.grade,
        quarter: existing.quarter,
        duration: existing.duration,
        templateId: existing.templateId,
        learners: '',
        notes: existing.remarks,
      }
      const fresh = await generatePlan({
        request,
        competency,
        template,
        ownerId: existing.ownerId,
        existing,
      })
      all.value = all.value.map((p) => (p.id === id ? fresh : p))
      catalog.noteTemplateUse(template.id)
      return fresh
    } finally {
      generating.value = false
    }
  }

  function update(id: string, patch: Partial<LessonPlan>) {
    all.value = all.value.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
    )
    return byId(id)
  }

  function remove(id: string) {
    all.value = all.value.filter((p) => p.id !== id)
  }

  function duplicate(id: string) {
    const source = byId(id)
    if (!source) return null
    const copy: LessonPlan = {
      ...source,
      id: `p-${Math.random().toString(36).slice(2, 9)}`,
      title: `${source.title} (copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.value = [copy, ...all.value]
    return copy
  }

  const totalPlans = computed(() => all.value.length)
  const finalCount = computed(() => all.value.filter((p) => p.status === 'final').length)
  const draftCount = computed(() => all.value.filter((p) => p.status === 'draft').length)
  const totalGenerations = computed(() => all.value.reduce((sum, p) => sum + p.generationCount, 0))

  function reset() {
    all.value = seedPlans
  }

  return {
    all,
    generating,
    lastRequest,
    totalPlans,
    finalCount,
    draftCount,
    totalGenerations,
    forOwner,
    byId,
    generate,
    regenerate,
    update,
    remove,
    duplicate,
    reset,
  }
})
