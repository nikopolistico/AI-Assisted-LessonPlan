export type Role = 'teacher' | 'admin'

export type UserStatus = 'active' | 'pending' | 'disabled'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  school: string
  gradeLevels: string[]
  createdAt: string
  lastLogin: string | null
}

/** A Most Essential Learning Competency from the DepEd Mathematics curriculum guide. */
export interface Competency {
  id: string
  code: string
  grade: string
  quarter: 1 | 2 | 3 | 4
  domain: string
  description: string
  active: boolean
}

export interface LessonTemplate {
  id: string
  name: string
  approach: string
  description: string
  sections: string[]
  active: boolean
  isDefault: boolean
  usageCount: number
}

export type PlanStatus = 'draft' | 'final'

export interface LessonSection {
  key: string
  title: string
  minutes: number
  body: string
}

export interface LessonPlan {
  id: string
  title: string
  topic: string
  competencyId: string
  competencyCode: string
  grade: string
  quarter: 1 | 2 | 3 | 4
  duration: number
  templateId: string
  templateName: string
  ownerId: string
  status: PlanStatus
  objectives: string[]
  materials: string[]
  sections: LessonSection[]
  assessment: string
  assignment: string
  remarks: string
  createdAt: string
  updatedAt: string
  generationCount: number
}

export interface LessonRequest {
  topic: string
  competencyId: string
  grade: string
  quarter: 1 | 2 | 3 | 4
  duration: number
  templateId: string
  learners: string
  notes: string
}
