# Lesson Plan AI

A Vue 3 prototype of an AI-assisted Mathematics lesson plan generator for DepEd teachers, built
around the two actors in the use case document: the **Teacher** (primary user) and the **Admin**.

Stack: Vue 3 + TypeScript, Vite, Pinia, Vue Router, Tailwind CSS v4 and shadcn-vue components
(reka-ui primitives, lucide icons).

## Actors and screens

### Teacher

| Use case                       | Where                                                     |
| ------------------------------ | --------------------------------------------------------- |
| Log in / access system         | `/login`                                                  |
| Input lesson details           | `/teacher/generate` — topic, MELC, grade level, quarter, duration, template |
| Generate lesson plan           | `/teacher/generate` → redirects to the new plan            |
| View lesson plan               | `/teacher/plans/:id`                                       |
| Edit lesson plan               | `/teacher/plans/:id` → **Edit**                            |
| Regenerate lesson plan         | `/teacher/plans/:id` → **Regenerate**                      |
| Save / download lesson plan    | `/teacher/plans/:id` → **Save / Download** (print, .txt, .md, .json) |
| —                              | `/teacher` dashboard and `/teacher/plans` list             |

### Admin

| Use case                  | Where                  |
| ------------------------- | ---------------------- |
| Log in / access system    | `/login`               |
| Manage user accounts      | `/admin/users` — registration, approval, roles, disable |
| Manage math competencies  | `/admin/competencies` — MELC data per grade, quarter and domain |
| Manage lesson templates   | `/admin/templates` — sections, default template, activation |
| View system reports       | `/admin/reports` — usage per grade, domain and teacher, CSV export |
| —                         | `/admin` overview dashboard |

Routes are guarded by role: a teacher who opens an `/admin` URL is sent back to their own workspace,
and signed-out visitors are redirected to `/login` with a return path.

## Demo accounts

Password for every seeded account is `lessonplan`.

- Teacher — `teacher@lessonplan.ph`
- Admin — `admin@lessonplan.ph`

The login screen lists both and fills the form when you click one.

## Data

There is no backend yet. Seed data lives in `src/data/seed.ts` and every change is persisted to
`localStorage` through the Pinia stores in `src/stores/`. Generation is simulated in
`src/lib/generator.ts`, which composes a plan from the selected template, MELC and lesson details —
swap that module for a real API call and the screens do not change.

## Project setup

```sh
npm install
npm run dev        # start the dev server
npm run build      # type-check and build for production
npm run lint       # oxlint + eslint
npm run format     # prettier
```

Recommended editor setup: [VS Code](https://code.visualstudio.com/) with
[Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar), and disable Vetur.

## Supabase

SQL lives in `supabase/`:

- `supabase/migrations/20260902120000_init.sql` — extensions, enums, tables, indexes, triggers,
  auth wiring, Row Level Security policies and every RPC function
- `supabase/seed.sql` — MELCs, lesson templates, section prompts and per-domain materials

### Apply it

Either paste both files into the Supabase **SQL Editor** in that order, or use the CLI:

```sh
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies supabase/migrations/
npx supabase db reset         # local: migrations + seed.sql
```

Then create your first account under **Authentication → Users** and promote it:

```sql
select public.promote_to_admin('admin@lessonplan.ph');
```

New sign-ups land as `pending` teachers; an admin approves them from `/admin/users`.

### Connect the app

```sh
cp .env.example .env.local    # fill in the project URL and anon key
```

`src/lib/supabase.ts` exports the typed client and `isSupabaseConfigured`; row and function types are
in `src/lib/database.types.ts`.

### Schema

| Table                   | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `profiles`              | One row per `auth.users` account: role, status, school, grades   |
| `competencies`          | MELC catalogue (code, grade, quarter, domain, active)            |
| `lesson_templates`      | Instructional models and their ordered sections                  |
| `section_prompts`       | Prose the generator drops into each section (`{topic}` is substituted) |
| `domain_materials`      | Default learning resources per curriculum domain                 |
| `lesson_plans`          | Generated plans, owned by a teacher                              |
| `lesson_plan_revisions` | Snapshot taken before every regeneration                         |

RLS is on for every table. Teachers read and write only their own plans; reference data is readable
by any signed-in user and writable only by admins; admins can read all plans for reporting.

### Functions

**Generation**

- `build_plan_sections(template_id, topic, duration)` — splits the period across the template's
  sections (leftover minutes go to the earliest ones) and fills each body from `section_prompts`
- `build_plan_objectives(competency_id, topic, seed)` / `build_plan_materials(competency_id)`

**Teacher**

- `competencies_for(grade, quarter)` — the MELC picker
- `generate_lesson_plan(topic, competency_id, grade, quarter, duration, template_id, notes)`
- `regenerate_lesson_plan(plan_id)` — snapshots the current version, then rebuilds it
- `set_plan_status(plan_id, status)`, `my_plan_summary()`, `my_uncovered_competencies(limit)`,
  `record_login()`

**Admin**

- `approve_user(user_id)`, `set_user_status(user_id, status)`, `set_user_role(user_id, role)`
- `set_default_template(template_id)`, `import_competencies(jsonb)`

**Reports**

- `report_overview()`, `report_plans_by_grade()`, `report_plans_by_domain(grade)`,
  `report_teacher_activity()`, `report_melc_coverage()`, `report_template_usage()`

Example:

```ts
const { data, error } = await supabase.rpc('generate_lesson_plan', {
  p_topic: 'Adding fractions with dissimilar denominators',
  p_competency_id: competencyId,
  p_grade: 'Grade 3',
  p_quarter: 2,
  p_duration: 50,
  p_template_id: templateId,
  p_notes: '',
})
```

> The Pinia stores still read and write `localStorage`; wiring them to these tables and RPCs is the
> next step.
