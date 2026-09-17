/**
 * Conversions between the snake_case Supabase rows in `database.types.ts` and the
 * camelCase domain types in `types.ts` that the stores and views work with.
 */
import type {
  CompetencyRow,
  LessonPlanRow,
  LessonTemplateRow,
  UserRow,
} from './database.types'
import type { Competency, LessonPlan, LessonSection, LessonTemplate, User } from '@/types'

type Quarter = 1 | 2 | 3 | 4

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    school: row.school,
    gradeLevels: row.grade_levels,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  }
}

export function toCompetency(row: CompetencyRow): Competency {
  return {
    id: row.id,
    code: row.code,
    grade: row.grade,
    quarter: row.quarter as Quarter,
    domain: row.domain,
    description: row.description,
    active: row.active,
  }
}

export function competencyToRow(
  input: Omit<Competency, 'id'>,
): Omit<CompetencyRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    code: input.code,
    grade: input.grade,
    quarter: input.quarter,
    domain: input.domain,
    description: input.description,
    active: input.active,
  }
}

export function toTemplate(row: LessonTemplateRow): LessonTemplate {
  return {
    id: row.id,
    name: row.name,
    approach: row.approach,
    description: row.description,
    sections: row.sections,
    active: row.active,
    isDefault: row.is_default,
    usageCount: row.usage_count,
  }
}

export function templateToRow(
  input: Omit<LessonTemplate, 'id' | 'usageCount'>,
): Omit<LessonTemplateRow, 'id' | 'usage_count' | 'created_at' | 'updated_at'> {
  return {
    name: input.name,
    approach: input.approach,
    description: input.description,
    sections: input.sections,
    active: input.active,
    is_default: input.isDefault,
  }
}

export function toPlan(row: LessonPlanRow): LessonPlan {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    competencyId: row.competency_id ?? '',
    competencyCode: row.competency_code,
    grade: row.grade,
    quarter: row.quarter as Quarter,
    duration: row.duration_minutes,
    templateId: row.template_id ?? '',
    templateName: row.template_name,
    ownerId: row.owner_id,
    status: row.status,
    objectives: row.objectives,
    materials: row.materials,
    sections: row.sections as LessonSection[],
    assessment: row.assessment,
    assignment: row.assignment,
    remarks: row.remarks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    generationCount: row.generation_count,
  }
}

/** Maps an editable slice of a plan back to column names for `update`. */
export function planPatchToRow(patch: Partial<LessonPlan>): Partial<LessonPlanRow> {
  const row: Partial<LessonPlanRow> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.duration !== undefined) row.duration_minutes = patch.duration
  if (patch.status !== undefined) row.status = patch.status
  if (patch.objectives !== undefined) row.objectives = patch.objectives
  if (patch.materials !== undefined) row.materials = patch.materials
  if (patch.sections !== undefined) row.sections = patch.sections
  if (patch.assessment !== undefined) row.assessment = patch.assessment
  if (patch.assignment !== undefined) row.assignment = patch.assignment
  if (patch.remarks !== undefined) row.remarks = patch.remarks
  return row
}
