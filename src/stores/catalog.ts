import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Competency, LessonTemplate } from '@/types'
import { seedCompetencies, seedTemplates } from '@/data/seed'
import { loadState, saveState } from '@/lib/persist'

const COMPETENCY_KEY = 'alp.competencies'
const TEMPLATE_KEY = 'alp.templates'

export type CompetencyDraft = Omit<Competency, 'id'>
export type TemplateDraft = Omit<LessonTemplate, 'id' | 'usageCount'>

/** MELC data and lesson templates: maintained by the admin, consumed by the teacher. */
export const useCatalogStore = defineStore('catalog', () => {
  const competencies = ref<Competency[]>(loadState<Competency[]>(COMPETENCY_KEY, seedCompetencies))
  const templates = ref<LessonTemplate[]>(loadState<LessonTemplate[]>(TEMPLATE_KEY, seedTemplates))

  watch(competencies, (value) => saveState(COMPETENCY_KEY, value), { deep: true })
  watch(templates, (value) => saveState(TEMPLATE_KEY, value), { deep: true })

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

  function addCompetency(draft: CompetencyDraft) {
    const item: Competency = { ...draft, id: `c-${Math.random().toString(36).slice(2, 8)}` }
    competencies.value = [item, ...competencies.value]
    return item
  }

  function updateCompetency(id: string, patch: Partial<Competency>) {
    competencies.value = competencies.value.map((c) => (c.id === id ? { ...c, ...patch } : c))
  }

  function removeCompetency(id: string) {
    competencies.value = competencies.value.filter((c) => c.id !== id)
  }

  function addTemplate(draft: TemplateDraft) {
    const item: LessonTemplate = {
      ...draft,
      id: `t-${Math.random().toString(36).slice(2, 8)}`,
      usageCount: 0,
    }
    templates.value = [item, ...templates.value]
    if (item.isDefault) makeDefault(item.id)
    return item
  }

  function updateTemplate(id: string, patch: Partial<LessonTemplate>) {
    templates.value = templates.value.map((t) => (t.id === id ? { ...t, ...patch } : t))
    if (patch.isDefault) makeDefault(id)
  }

  function makeDefault(id: string) {
    templates.value = templates.value.map((t) => ({ ...t, isDefault: t.id === id }))
  }

  function removeTemplate(id: string) {
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  function noteTemplateUse(id: string) {
    templates.value = templates.value.map((t) =>
      t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t,
    )
  }

  function reset() {
    competencies.value = seedCompetencies
    templates.value = seedTemplates
  }

  return {
    competencies,
    templates,
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
    noteTemplateUse,
    reset,
  }
})
