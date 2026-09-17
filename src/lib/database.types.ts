/**
 * Types for the Supabase schema in `supabase/setup.sql`.
 *
 * Hand-written to match that file. Once the project is live you can
 * regenerate them instead:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type AppRole = 'teacher' | 'admin'
export type AccountStatus = 'active' | 'pending' | 'disabled'
export type PlanStatus = 'draft' | 'final'

export type PlanSectionRow = {
  key: string
  title: string
  minutes: number
  body: string
}

export type UserRow = {
  id: string
  full_name: string
  email: string
  role: AppRole
  status: AccountStatus
  school: string
  grade_levels: string[]
  last_login: string | null
  created_at: string
  updated_at: string
}

export type CompetencyRow = {
  id: string
  code: string
  grade: string
  quarter: number
  domain: string
  description: string
  active: boolean
  created_at: string
  updated_at: string
}

export type LessonTemplateRow = {
  id: string
  name: string
  approach: string
  description: string
  sections: string[]
  active: boolean
  is_default: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export type LessonPlanRow = {
  id: string
  owner_id: string
  title: string
  topic: string
  competency_id: string | null
  competency_code: string
  grade: string
  quarter: number
  duration_minutes: number
  template_id: string | null
  template_name: string
  status: PlanStatus
  objectives: string[]
  materials: string[]
  sections: PlanSectionRow[]
  assessment: string
  assignment: string
  remarks: string
  generation_count: number
  created_at: string
  updated_at: string
}

export type LessonPlanRevisionRow = {
  id: string
  plan_id: string
  revision: number
  snapshot: LessonPlanRow
  created_by: string | null
  created_at: string
}

export type SectionPromptRow = {
  key: string
  body: string
  updated_at: string
}

export type DomainMaterialRow = {
  domain: string
  materials: string[]
  updated_at: string
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      users: Table<UserRow, Omit<UserRow, 'created_at' | 'updated_at'>>
      competencies: Table<CompetencyRow, Omit<CompetencyRow, 'id' | 'created_at' | 'updated_at'>>
      lesson_templates: Table<
        LessonTemplateRow,
        Omit<LessonTemplateRow, 'id' | 'usage_count' | 'created_at' | 'updated_at'>
      >
      lesson_plans: Table<LessonPlanRow, Omit<LessonPlanRow, 'id' | 'created_at' | 'updated_at'>>
      lesson_plan_revisions: Table<
        LessonPlanRevisionRow,
        Omit<LessonPlanRevisionRow, 'id' | 'created_at'>
      >
      section_prompts: Table<SectionPromptRow, Omit<SectionPromptRow, 'updated_at'>>
      domain_materials: Table<DomainMaterialRow, Omit<DomainMaterialRow, 'updated_at'>>
    }
    Views: Record<never, never>
    Functions: {
      is_admin: { Args: { p_uid?: string }; Returns: boolean }
      is_active: { Args: { p_uid?: string }; Returns: boolean }
      assert_admin: { Args: Record<string, never>; Returns: undefined }

      competencies_for: { Args: { p_grade: string; p_quarter?: number }; Returns: CompetencyRow[] }
      build_plan_sections: {
        Args: { p_template_id: string; p_topic: string; p_duration: number }
        Returns: PlanSectionRow[]
      }
      build_plan_objectives: {
        Args: { p_competency_id: string; p_topic: string; p_seed: number }
        Returns: string[]
      }
      build_plan_materials: { Args: { p_competency_id: string }; Returns: string[] }

      generate_lesson_plan: {
        Args: {
          p_topic: string
          p_competency_id: string
          p_grade: string
          p_quarter: number
          p_duration: number
          p_template_id?: string
          p_notes?: string
        }
        Returns: LessonPlanRow
      }
      regenerate_lesson_plan: { Args: { p_plan_id: string }; Returns: LessonPlanRow }
      set_plan_status: { Args: { p_plan_id: string; p_status: PlanStatus }; Returns: LessonPlanRow }

      my_plan_summary: {
        Args: Record<string, never>
        Returns: {
          total_plans: number
          drafts: number
          finalised: number
          minutes_planned: number
          generations: number
        }[]
      }
      my_uncovered_competencies: { Args: { p_limit?: number }; Returns: CompetencyRow[] }
      record_login: { Args: Record<string, never>; Returns: undefined }

      set_user_status: { Args: { p_user_id: string; p_status: AccountStatus }; Returns: UserRow }
      set_user_role: { Args: { p_user_id: string; p_role: AppRole }; Returns: UserRow }
      approve_user: { Args: { p_user_id: string }; Returns: UserRow }
      set_default_template: { Args: { p_template_id: string }; Returns: LessonTemplateRow }
      increment_template_usage: { Args: { p_template_id: string }; Returns: undefined }
      import_competencies: { Args: { p_rows: unknown }; Returns: number }

      report_overview: {
        Args: Record<string, never>
        Returns: {
          total_accounts: number
          active_accounts: number
          pending_accounts: number
          teachers: number
          competencies_total: number
          competencies_active: number
          templates_active: number
          total_plans: number
          total_generations: number
        }[]
      }
      report_plans_by_grade: {
        Args: Record<string, never>
        Returns: { grade: string; plans: number; finalised: number; minutes: number }[]
      }
      report_plans_by_domain: {
        Args: { p_grade?: string | null }
        Returns: { domain: string; plans: number }[]
      }
      report_teacher_activity: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          full_name: string
          school: string
          status: AccountStatus
          plans: number
          finalised: number
          generations: number
          minutes: number
          last_login: string | null
        }[]
      }
      report_melc_coverage: {
        Args: Record<string, never>
        Returns: { covered: number; total: number; percent: number }[]
      }
      report_template_usage: {
        Args: Record<string, never>
        Returns: {
          template_id: string
          name: string
          approach: string
          active: boolean
          is_default: boolean
          usage_count: number
          plans: number
        }[]
      }
    }
    Enums: {
      app_role: AppRole
      account_status: AccountStatus
      plan_status: PlanStatus
    }
    CompositeTypes: Record<never, never>
  }
}
