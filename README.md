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

## Accounts

Authentication is Supabase Auth (email + password). Teachers register from the **Create an account**
link on the sign-in screen and are active straight away (no approval step). Bootstrap the first
administrator by creating an account, then running
`select public.promote_to_admin('<email>');` in the Supabase SQL Editor (see below).

## Data

Supabase is the single source of truth. The Pinia stores in `src/stores/` read and write the tables
and RPCs defined in `supabase/` — `auth` uses Supabase Auth and `public.users`, `plans` calls
`generate_lesson_plan` / `regenerate_lesson_plan`, `catalog` and `users` read reference data and
account rows. Row/function types are in `src/lib/database.types.ts` and the snake_case ↔ camelCase
mappers in `src/lib/mappers.ts`. Only UI preferences (theme, sidebar state) still use `localStorage`.
`GRADE_LEVELS` and `DURATIONS` in `src/data/seed.ts` are static option lists.

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

All the SQL is one file:

- `supabase/setup.sql` — drops every app object, then recreates the extensions, enums, tables,
  indexes, triggers, auth wiring, Row Level Security policies, every RPC function, and the seed
  data (MELCs, lesson templates, section prompts, per-domain materials). Safe to re-run.

### Apply it

Paste `supabase/setup.sql` into the Supabase **SQL Editor** and run it. In
**Authentication → Sign In / Providers → Email**, keep **"Confirm email" on** so new accounts
must click the confirmation link Supabase emails them before they can sign in.

Then sign up through the app, confirm the address from the email Supabase sends, and promote
your account:

```sql
select public.promote_to_admin('admin@lessonplan.ph');
```

New sign-ups become active teachers as soon as they confirm their email.

### Connect the app

```sh
cp .env.example .env.local    # fill in the project URL and anon key
```

`src/lib/supabase.ts` exports the typed client and `isSupabaseConfigured`; row and function types are
in `src/lib/database.types.ts`.

### Schema

| Table                   | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `users`                 | One row per `auth.users` account: role, status, school, grades   |
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

The stores in `src/stores/` call these directly — `usePlansStore().generate()` wraps
`generate_lesson_plan`, and so on.

## AI lesson generation

`src/lib/openai.ts` builds the prompt and calls `/api/lesson-plan` — a Vercel Edge Function
(`api/lesson-plan.ts`) that forwards to an OpenAI-compatible `/chat/completions` endpoint. The
browser never talks to the model API directly: OpenAI (and most gateways) don't send CORS headers
permitting that, and it would also ship the API key to every visitor.

Configure the proxy with plain (non-`VITE_`) env vars in the Vercel project's **Settings →
Environment Variables**:

| Variable          | Required | Purpose                                                        |
| ----------------- | -------- | --------------------------------------------------------------- |
| `OPENAI_API_KEY`  | yes      | Server-side secret, never sent to the browser                   |
| `OPENAI_MODEL`    | no       | Defaults to `gpt-4o-mini`                                       |
| `OPENAI_BASE_URL` | no       | Defaults to `https://api.openai.com/v1`; point at a gateway (e.g. OpenRouter) to use one |

`VITE_OPENAI_MODEL` in `.env.local` is separate and only controls the model name shown on the
Generate screen — keep it in sync with `OPENAI_MODEL`, but it doesn't select the model.

`npm run dev` also serves `/api/lesson-plan` locally: `vite.config.ts` runs that same handler
through a small dev-only middleware, reading `OPENAI_API_KEY` etc. straight from `.env.local`, so
no separate `vercel dev` step is needed to test generation.
