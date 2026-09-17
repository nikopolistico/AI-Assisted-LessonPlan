-- =============================================================================
-- Lesson Plan AI — full database setup (schema + functions + RLS + seed data)
--
-- ONE file. Run it in the Supabase SQL Editor (or `supabase db reset` after
-- placing it under supabase/migrations/). It drops every app object first, so it
-- is safe to re-run and always leaves the database in a known state.
--
-- Accounts still come from Supabase Auth. After the first sign-up:
--   select public.promote_to_admin('you@example.com');
--
-- Keep "Confirm email" ON in Authentication -> Sign In / Providers -> Email so
-- new accounts must click the link Supabase emails them before they can sign
-- in (src/stores/auth.ts and LoginView.vue already handle both states).
--
-- Contents
--   0. Clean slate
--   1. Extensions and enums
--   2. Tables
--   3. Indexes
--   4. Shared triggers
--   5. Auth wiring (auth.users -> public.users)
--   6. Row Level Security
--   7. Functions — generation
--   8. Functions — teacher actions
--   9. Functions — admin actions
--  10. Functions — system reports
--  11. Grants
--  12. Seed data (section prose, domain materials, templates, Grade 3 MELCs)
--  13. First-time setup helpers
-- =============================================================================


-- 0. Clean slate -----------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.lesson_plan_revisions,
  public.lesson_plans,
  public.domain_materials,
  public.section_prompts,
  public.lesson_templates,
  public.competencies,
  public.users,
  public.profiles
cascade;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
  loop
    execute format('drop function if exists %s cascade', fn.sig);
  end loop;
end $$;

drop type if exists
  public.plan_status,
  public.account_status,
  public.app_role
cascade;


-- 1. Extensions and enums -------------------------------------------------------

create extension if not exists "pgcrypto" with schema extensions;

create type public.app_role       as enum ('teacher', 'admin');
create type public.account_status as enum ('active', 'pending', 'disabled');
create type public.plan_status    as enum ('draft', 'final');


-- 2. Tables -------------------------------------------------------------------

-- One row per account, keyed to the Supabase Auth user. This is the users table
-- the app reads and writes; auth.users only holds the credentials.
create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text                     not null default '',
  email        text                     not null,
  role         public.app_role          not null default 'teacher',
  status       public.account_status    not null default 'active',
  school       text                     not null default '',
  grade_levels text[]                   not null default '{}',
  last_login   timestamptz,
  created_at   timestamptz              not null default now(),
  updated_at   timestamptz              not null default now()
);

comment on table public.users is
  'Application account for every auth user. Role drives access: teacher or admin.';

-- The DepEd Most Essential Learning Competencies teachers plan against.
create table public.competencies (
  id          uuid primary key default extensions.gen_random_uuid(),
  code        text        not null unique,
  grade       text        not null,
  quarter     smallint    not null check (quarter between 1 and 4),
  domain      text        not null,
  description text        not null,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- The system currently covers a single grade level. Add entries here
  -- (and to GRADE_LEVELS in src/data/seed.ts) to widen it.
  constraint competencies_grade_check check (grade in ('Grade 3'))
);

comment on table public.competencies is
  'MELC catalogue maintained by admins and consumed by the lesson generator.';

-- Instructional models (4As, 7Es, ...) a plan can be generated against.
create table public.lesson_templates (
  id          uuid primary key default extensions.gen_random_uuid(),
  name        text        not null unique,
  approach    text        not null default 'Custom',
  description text        not null default '',
  sections    text[]      not null check (array_length(sections, 1) >= 2),
  active      boolean     not null default true,
  is_default  boolean     not null default false,
  usage_count integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Boilerplate the generator drops into each section, keyed by lowercase title.
create table public.section_prompts (
  key        text primary key,
  body       text        not null,
  updated_at timestamptz not null default now()
);

comment on table public.section_prompts is
  'Per-section prose used by build_plan_sections. {topic} is substituted at generation time.';

-- Default learning resources suggested per curriculum domain.
create table public.domain_materials (
  domain     text primary key,
  materials  text[]      not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.lesson_plans (
  id               uuid primary key default extensions.gen_random_uuid(),
  owner_id         uuid        not null references public.users (id) on delete cascade,
  title            text        not null,
  topic            text        not null,
  competency_id    uuid        references public.competencies (id) on delete set null,
  -- Kept denormalised so a plan still cites its MELC if the catalogue row goes away.
  competency_code  text        not null,
  grade            text        not null,
  quarter          smallint    not null check (quarter between 1 and 4),
  duration_minutes integer     not null check (duration_minutes between 10 and 480),
  template_id      uuid        references public.lesson_templates (id) on delete set null,
  template_name    text        not null,
  status           public.plan_status not null default 'draft',
  objectives       text[]      not null default '{}',
  materials        text[]      not null default '{}',
  sections         jsonb       not null default '[]'::jsonb
                     check (jsonb_typeof(sections) = 'array'),
  assessment       text        not null default '',
  assignment       text        not null default '',
  remarks          text        not null default '',
  generation_count integer     not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.lesson_plans is
  'Generated lesson plans. Teachers own their rows; admins read all of them for reporting.';

-- Snapshot taken before each regeneration so nothing is lost.
create table public.lesson_plan_revisions (
  id            uuid primary key default extensions.gen_random_uuid(),
  plan_id       uuid        not null references public.lesson_plans (id) on delete cascade,
  revision      integer     not null,
  snapshot      jsonb       not null,
  created_by    uuid        references public.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (plan_id, revision)
);


-- 3. Indexes -----------------------------------------------------------------

create index competencies_grade_quarter_idx
  on public.competencies (grade, quarter) where active;
create index competencies_domain_idx
  on public.competencies (domain);

create index lesson_plans_owner_idx
  on public.lesson_plans (owner_id, updated_at desc);
create index lesson_plans_competency_idx
  on public.lesson_plans (competency_id);
create index lesson_plans_grade_idx
  on public.lesson_plans (grade);
create index lesson_plans_status_idx
  on public.lesson_plans (status);

create index lesson_plan_revisions_plan_idx
  on public.lesson_plan_revisions (plan_id, revision desc);

create index users_role_idx   on public.users (role);
create index users_status_idx on public.users (status);


-- 4. Shared triggers ---------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'competencies', 'lesson_templates', 'lesson_plans'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Exactly one template may carry the division default.
create or replace function public.enforce_single_default_template()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.lesson_templates
       set is_default = false
     where is_default and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger single_default_template
  before insert or update of is_default on public.lesson_templates
  for each row when (new.is_default)
  execute function public.enforce_single_default_template();

-- A teacher may edit their own account, but never their own role or status.
create or replace function public.guard_user_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- No JWT (SQL Editor, service role, `supabase db` CLI): trusted, allow it.
  if auth.uid() is null then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Only an administrator can change an account role.'
      using errcode = 'insufficient_privilege';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Only an administrator can change an account status.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger guard_user_privileges
  before update on public.users
  for each row execute function public.guard_user_privileges();

-- Count a template use whenever a plan is generated from it.
create or replace function public.bump_template_usage()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.template_id is not null then
    update public.lesson_templates
       set usage_count = usage_count + 1
     where id = new.template_id;
  end if;
  return new;
end;
$$;

create or replace function public.increment_template_usage(p_template_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.lesson_templates
     set usage_count = usage_count + 1
   where id = p_template_id;
$$;

create trigger bump_template_usage
  after insert on public.lesson_plans
  for each row execute function public.bump_template_usage();


-- 5. Auth wiring -------------------------------------------------------------

-- New sign-ups become active teachers straight away, so a teacher can use the
-- app as soon as they have signed up. Pass full_name / school / role in the
-- sign-up metadata to prefill the account. To bring back admin approval, change
-- 'active' to 'pending' and re-add the pending check in src/stores/auth.ts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (id, email, full_name, school, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'school', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'teacher'),
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 6. Row Level Security ------------------------------------------------------

-- Security definer so account policies can call it without recursing into RLS.
create or replace function public.is_admin(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
     where id = p_uid and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_active(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users where id = p_uid and status = 'active'
  );
$$;

alter table public.users                 enable row level security;
alter table public.competencies          enable row level security;
alter table public.lesson_templates      enable row level security;
alter table public.section_prompts       enable row level security;
alter table public.domain_materials      enable row level security;
alter table public.lesson_plans          enable row level security;
alter table public.lesson_plan_revisions enable row level security;

-- users ---------------------------------------------------------------------
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy users_insert on public.users
  for insert to authenticated
  with check (public.is_admin());

create policy users_update on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy users_delete on public.users
  for delete to authenticated
  using (public.is_admin() and id <> auth.uid());

-- Reference data: readable by any signed-in user, writable by admins only.
do $$
declare
  t text;
begin
  foreach t in array array['competencies', 'lesson_templates', 'section_prompts', 'domain_materials']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())',
      t || '_write', t);
  end loop;
end $$;

-- lesson_plans ---------------------------------------------------------------
create policy lesson_plans_select on public.lesson_plans
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy lesson_plans_insert on public.lesson_plans
  for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active());

create policy lesson_plans_update on public.lesson_plans
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy lesson_plans_delete on public.lesson_plans
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- lesson_plan_revisions ----------------------------------------------------
create policy lesson_plan_revisions_select on public.lesson_plan_revisions
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.lesson_plans p
       where p.id = plan_id and p.owner_id = auth.uid()
    )
  );

create policy lesson_plan_revisions_insert on public.lesson_plan_revisions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.lesson_plans p
       where p.id = plan_id and p.owner_id = auth.uid()
    )
  );


-- 7. Functions — generation --------------------------------------------------

-- Splits the period across a template's sections, giving the leftover minutes
-- to the earliest sections, and fills each one with its prompt text.
create or replace function public.build_plan_sections(
  p_template_id uuid,
  p_topic       text,
  p_duration    integer
)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  with tpl as (
    select sections from public.lesson_templates where id = p_template_id
  ),
  items as (
    select s.title, s.ord, count(*) over () as total
      from tpl, unnest(tpl.sections) with ordinality as s(title, ord)
  ),
  timed as (
    select
      title,
      ord,
      (p_duration / total) + case when ord <= (p_duration % total) then 1 else 0 end as minutes
    from items
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'key',     trim(both '-' from regexp_replace(lower(t.title), '[^a-z]+', '-', 'g')),
        'title',   t.title,
        'minutes', t.minutes,
        'body',    replace(
                     coalesce(
                       sp.body,
                       'Guide learners through {topic} using the materials prepared for this section.'
                     ),
                     '{topic}', p_topic
                   )
      )
      order by t.ord
    ),
    '[]'::jsonb
  )
  from timed t
  left join public.section_prompts sp on sp.key = lower(t.title);
$$;

comment on function public.build_plan_sections is
  'Returns the procedure array for a template: one object per section with key, title, minutes and body.';

-- Three objectives: the competency itself, a skill objective, an affective one.
create or replace function public.build_plan_objectives(
  p_competency_id uuid,
  p_topic         text,
  p_seed          integer
)
returns text[]
language sql
stable
set search_path = public, pg_temp
as $$
  select array[
    rtrim(c.description, '.') || '.',
    (array['Identify','Demonstrate','Apply','Explain','Construct','Compare'])
      [(greatest(p_seed, 1) - 1) % 6 + 1]
      || ' the concept of ' || p_topic || ' in guided and independent practice.',
    'Show accuracy and perseverance when working on ' || p_topic || '.'
  ]
  from public.competencies c
  where c.id = p_competency_id;
$$;

create or replace function public.build_plan_materials(p_competency_id uuid)
returns text[]
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select dm.materials
       from public.competencies c
       join public.domain_materials dm on dm.domain = c.domain
      where c.id = p_competency_id),
    array['Chalk and board', 'Worksheets', 'Visual aids']
  );
$$;


-- 8. Functions — teacher actions ---------------------------------------------

-- The MELC picker: active competencies for a grade, optionally one quarter.
create or replace function public.competencies_for(
  p_grade   text,
  p_quarter smallint default null
)
returns setof public.competencies
language sql
stable
set search_path = public, pg_temp
as $$
  select *
    from public.competencies
   where active
     and grade = p_grade
     and (p_quarter is null or quarter = p_quarter)
   order by quarter, code;
$$;

-- Use case: Input lesson details -> Generate lesson plan.
create or replace function public.generate_lesson_plan(
  p_topic         text,
  p_competency_id uuid,
  p_grade         text,
  p_quarter       smallint,
  p_duration      integer,
  p_template_id   uuid default null,
  p_notes         text default ''
)
returns public.lesson_plans
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_competency public.competencies;
  v_template   public.lesson_templates;
  v_topic      text;
  v_plan       public.lesson_plans;
begin
  select * into v_competency from public.competencies where id = p_competency_id and active;
  if not found then
    raise exception 'That competency is not available.' using errcode = 'no_data_found';
  end if;

  if p_template_id is null then
    select * into v_template from public.lesson_templates
     where active and is_default order by name limit 1;
  else
    select * into v_template from public.lesson_templates where id = p_template_id and active;
  end if;
  if not found then
    raise exception 'That lesson template is not available.' using errcode = 'no_data_found';
  end if;

  v_topic := nullif(btrim(p_topic), '');
  if v_topic is null then
    v_topic := rtrim(v_competency.description, '.');
  end if;

  insert into public.lesson_plans (
    owner_id, title, topic, competency_id, competency_code, grade, quarter,
    duration_minutes, template_id, template_name, status,
    objectives, materials, sections, assessment, assignment, remarks, generation_count
  )
  values (
    auth.uid(),
    initcap(left(v_topic, 1)) || substr(v_topic, 2),
    v_topic,
    v_competency.id,
    v_competency.code,
    p_grade,
    p_quarter,
    p_duration,
    v_template.id,
    v_template.name,
    'draft',
    public.build_plan_objectives(v_competency.id, v_topic, 1),
    public.build_plan_materials(v_competency.id),
    public.build_plan_sections(v_template.id, v_topic, p_duration),
    'Short ' || greatest(5, round(p_duration / 10.0))::int || '-item check on '
      || v_topic || ', with mastery set at 80%.',
    'Answer the practice set on ' || v_topic
      || ' in the Learners Material and bring one real-life example to the next meeting.',
    coalesce(btrim(p_notes), ''),
    1
  )
  returning * into v_plan;

  return v_plan;
end;
$$;

comment on function public.generate_lesson_plan is
  'Creates a lesson plan for the calling teacher from a competency, template and period length.';

-- Use case: Regenerate lesson plan. The previous version is kept as a revision.
create or replace function public.regenerate_lesson_plan(p_plan_id uuid)
returns public.lesson_plans
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_plan public.lesson_plans;
  v_seed integer;
begin
  select * into v_plan from public.lesson_plans
   where id = p_plan_id and owner_id = auth.uid();
  if not found then
    raise exception 'Lesson plan not found.' using errcode = 'no_data_found';
  end if;

  insert into public.lesson_plan_revisions (plan_id, revision, snapshot, created_by)
  values (v_plan.id, v_plan.generation_count, to_jsonb(v_plan), auth.uid());

  v_seed := v_plan.generation_count + 1;

  update public.lesson_plans
     set objectives       = public.build_plan_objectives(competency_id, topic, v_seed),
         materials        = public.build_plan_materials(competency_id),
         sections         = public.build_plan_sections(template_id, topic, duration_minutes),
         status           = 'draft',
         generation_count = v_seed
   where id = p_plan_id
   returning * into v_plan;

  perform public.increment_template_usage(v_plan.template_id);

  return v_plan;
end;
$$;

-- Use case: Save lesson plan (draft <-> final).
create or replace function public.set_plan_status(
  p_plan_id uuid,
  p_status  public.plan_status
)
returns public.lesson_plans
language sql
set search_path = public, pg_temp
as $$
  update public.lesson_plans
     set status = p_status
   where id = p_plan_id and owner_id = auth.uid()
  returning *;
$$;

-- Teacher dashboard counters in a single round trip.
create or replace function public.my_plan_summary()
returns table (
  total_plans     bigint,
  drafts          bigint,
  finalised       bigint,
  minutes_planned bigint,
  generations     bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    count(*)                                              as total_plans,
    count(*) filter (where status = 'draft')              as drafts,
    count(*) filter (where status = 'final')              as finalised,
    coalesce(sum(duration_minutes), 0)                    as minutes_planned,
    coalesce(sum(generation_count), 0)                    as generations
  from public.lesson_plans
  where owner_id = auth.uid();
$$;

-- Competencies for the caller's own grade levels that have no plan yet.
create or replace function public.my_uncovered_competencies(p_limit integer default 5)
returns setof public.competencies
language sql
stable
set search_path = public, pg_temp
as $$
  select c.*
    from public.competencies c
    join public.users u on u.id = auth.uid()
   where c.active
     and c.grade = any (u.grade_levels)
     and not exists (
       select 1 from public.lesson_plans lp
        where lp.owner_id = auth.uid() and lp.competency_id = c.id
     )
   order by c.grade, c.quarter, c.code
   limit greatest(p_limit, 1);
$$;


-- 9. Functions — admin actions -----------------------------------------------

create or replace function public.assert_admin()
returns void
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = 'insufficient_privilege';
  end if;
end;
$$;

-- Use case: Manage user accounts.
create or replace function public.set_user_status(
  p_user_id uuid,
  p_status  public.account_status
)
returns public.users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user public.users;
begin
  perform public.assert_admin();
  if p_user_id = auth.uid() and p_status <> 'active' then
    raise exception 'You cannot disable your own account.' using errcode = 'check_violation';
  end if;

  update public.users set status = p_status where id = p_user_id
  returning * into v_user;

  if not found then
    raise exception 'Account not found.' using errcode = 'no_data_found';
  end if;
  return v_user;
end;
$$;

create or replace function public.set_user_role(p_user_id uuid, p_role public.app_role)
returns public.users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user public.users;
begin
  perform public.assert_admin();
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own administrator role.' using errcode = 'check_violation';
  end if;

  update public.users set role = p_role where id = p_user_id
  returning * into v_user;

  if not found then
    raise exception 'Account not found.' using errcode = 'no_data_found';
  end if;
  return v_user;
end;
$$;

create or replace function public.approve_user(p_user_id uuid)
returns public.users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.set_user_status(p_user_id, 'active'::public.account_status);
end;
$$;

-- Use case: Manage lesson templates — promote one template to the division default.
create or replace function public.set_default_template(p_template_id uuid)
returns public.lesson_templates
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_template public.lesson_templates;
begin
  perform public.assert_admin();
  update public.lesson_templates
     set is_default = true, active = true
   where id = p_template_id
  returning * into v_template;

  if not found then
    raise exception 'Template not found.' using errcode = 'no_data_found';
  end if;
  return v_template;
end;
$$;

-- Bulk MELC import: upsert rows from a JSON array, matched on code.
create or replace function public.import_competencies(p_rows jsonb)
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  perform public.assert_admin();

  insert into public.competencies (code, grade, quarter, domain, description, active)
  select
    r ->> 'code',
    r ->> 'grade',
    (r ->> 'quarter')::smallint,
    r ->> 'domain',
    r ->> 'description',
    coalesce((r ->> 'active')::boolean, true)
  from jsonb_array_elements(p_rows) as r
  on conflict (code) do update
    set grade       = excluded.grade,
        quarter     = excluded.quarter,
        domain      = excluded.domain,
        description = excluded.description,
        active      = excluded.active;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.import_competencies is
  'Upserts a JSON array of MELC rows: [{"code","grade","quarter","domain","description","active"}].';


-- 10. Functions — system reports ---------------------------------------------
-- All security definer so an admin can aggregate across every teacher's rows.

create or replace function public.report_overview()
returns table (
  total_accounts      bigint,
  active_accounts     bigint,
  pending_accounts    bigint,
  teachers            bigint,
  competencies_total  bigint,
  competencies_active bigint,
  templates_active    bigint,
  total_plans         bigint,
  total_generations   bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_admin();
  return query
  select
    (select count(*) from public.users),
    (select count(*) from public.users where status = 'active'),
    (select count(*) from public.users where status = 'pending'),
    (select count(*) from public.users where role = 'teacher'),
    (select count(*) from public.competencies),
    (select count(*) from public.competencies where active),
    (select count(*) from public.lesson_templates where active),
    (select count(*) from public.lesson_plans),
    (select coalesce(sum(generation_count), 0) from public.lesson_plans);
end;
$$;

create or replace function public.report_plans_by_grade()
returns table (grade text, plans bigint, finalised bigint, minutes bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_admin();
  return query
  select
    lp.grade,
    count(*),
    count(*) filter (where lp.status = 'final'),
    coalesce(sum(lp.duration_minutes), 0)
  from public.lesson_plans lp
  group by lp.grade
  order by count(*) desc, lp.grade;
end;
$$;

create or replace function public.report_plans_by_domain(p_grade text default null)
returns table (domain text, plans bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_admin();
  return query
  select
    coalesce(c.domain, 'Unclassified') as domain,
    count(*)
  from public.lesson_plans lp
  left join public.competencies c on c.id = lp.competency_id
  where p_grade is null or lp.grade = p_grade
  group by 1
  order by 2 desc, 1;
end;
$$;

create or replace function public.report_teacher_activity()
returns table (
  user_id     uuid,
  full_name   text,
  school      text,
  status      public.account_status,
  plans       bigint,
  finalised   bigint,
  generations bigint,
  minutes     bigint,
  last_login  timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_admin();
  return query
  select
    u.id,
    u.full_name,
    u.school,
    u.status,
    count(lp.id),
    count(lp.id) filter (where lp.status = 'final'),
    coalesce(sum(lp.generation_count), 0),
    coalesce(sum(lp.duration_minutes), 0),
    u.last_login
  from public.users u
  left join public.lesson_plans lp on lp.owner_id = u.id
  where u.role = 'teacher'
  group by u.id
  order by count(lp.id) desc, u.full_name;
end;
$$;

create or replace function public.report_melc_coverage()
returns table (covered bigint, total bigint, percent numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_admin();
  return query
  with active as (select id from public.competencies where active),
       hit as (
         select distinct competency_id from public.lesson_plans
          where competency_id is not null
       )
  select
    (select count(*) from active a join hit h on h.competency_id = a.id),
    (select count(*) from active),
    case
      when (select count(*) from active) = 0 then 0
      else round(
        (select count(*) from active a join hit h on h.competency_id = a.id)::numeric
        * 100 / (select count(*) from active), 1)
    end;
end;
$$;

create or replace function public.report_template_usage()
returns table (
  template_id uuid,
  name        text,
  approach    text,
  active      boolean,
  is_default  boolean,
  usage_count integer,
  plans       bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_admin();
  return query
  select t.id, t.name, t.approach, t.active, t.is_default, t.usage_count, count(lp.id)
    from public.lesson_templates t
    left join public.lesson_plans lp on lp.template_id = t.id
   group by t.id
   order by t.usage_count desc, t.name;
end;
$$;

-- Called after a successful sign-in so reports can show real login activity.
create or replace function public.record_login()
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.users set last_login = now() where id = auth.uid();
$$;


-- 11. Grants -----------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.lesson_plans          to authenticated;
grant select, insert                 on public.lesson_plan_revisions to authenticated;
grant select, insert, update, delete on public.users                 to authenticated;
grant select, insert, update, delete on public.competencies          to authenticated;
grant select, insert, update, delete on public.lesson_templates      to authenticated;
grant select, insert, update, delete on public.section_prompts       to authenticated;
grant select, insert, update, delete on public.domain_materials      to authenticated;
-- Row Level Security above is what actually restricts these to the right actor.

grant execute on function
  public.is_admin(uuid),
  public.is_active(uuid),
  public.assert_admin(),
  public.increment_template_usage(uuid),
  public.competencies_for(text, smallint),
  public.build_plan_sections(uuid, text, integer),
  public.build_plan_objectives(uuid, text, integer),
  public.build_plan_materials(uuid),
  public.generate_lesson_plan(text, uuid, text, smallint, integer, uuid, text),
  public.regenerate_lesson_plan(uuid),
  public.set_plan_status(uuid, public.plan_status),
  public.my_plan_summary(),
  public.my_uncovered_competencies(integer),
  public.record_login(),
  public.set_user_status(uuid, public.account_status),
  public.set_user_role(uuid, public.app_role),
  public.approve_user(uuid),
  public.set_default_template(uuid),
  public.import_competencies(jsonb),
  public.report_overview(),
  public.report_plans_by_grade(),
  public.report_plans_by_domain(text),
  public.report_teacher_activity(),
  public.report_melc_coverage(),
  public.report_template_usage()
to authenticated;


-- 12. Seed data -------------------------------------------------------------

-- Section prose used by build_plan_sections(). Keys are lowercase section titles.
insert into public.section_prompts (key, body) values
  ('activity',
   'Open with a hands-on group task on {topic}. Learners work in fours with the prepared materials while you move around and note the strategies they try.'),
  ('analysis',
   'Draw out the thinking behind the activity: What did your group notice about {topic}? Which step gave you difficulty, and why? Chart the responses on the board.'),
  ('abstraction',
   'Formalise the concept. State the rule for {topic} in the learners'' own words first, then in mathematical language, and model three worked examples of increasing difficulty.'),
  ('application',
   'Learners apply {topic} to a real-life situation drawn from the community, then explain their solution to a seatmate before writing it down.'),
  ('elicit',
   'Two-minute drill on the prerequisite skill for {topic} to surface what learners already carry into the lesson.'),
  ('engage',
   'Present a short situation or puzzle about {topic} that has no obvious answer, and let learners predict before any instruction begins.'),
  ('explore',
   'Groups investigate {topic} with the manipulatives provided, recording what they observe on a shared table. Circulate and ask probing questions instead of giving answers.'),
  ('explain',
   'Groups report their findings. Guide the class from their observations to the formal statement of {topic}, correcting misconceptions as they surface.'),
  ('elaborate',
   'Extend {topic} to a less familiar case, including one problem where the given information is incomplete so learners must reason about what is missing.'),
  ('evaluate',
   'Short individual check on {topic}. Collect the responses before dismissal so results can inform tomorrow''s opening drill.'),
  ('extend',
   'Challenge task for early finishers: pose a problem on {topic} with more than one valid approach and ask learners to justify the one they picked.'),
  ('review',
   'Revisit the prerequisite skill for {topic} with a five-item board drill, calling on learners who struggled in the previous session.'),
  ('modelling (i do)',
   'Think aloud through two examples of {topic}, naming each decision as you make it so learners hear the reasoning, not only the steps.'),
  ('guided practice (we do)',
   'Work through {topic} together. Learners write each step on their boards and hold them up so you can spot errors immediately.'),
  ('independent practice (you do)',
   'Learners complete a short set on {topic} on their own while you conference with the two or three who need the most support.')
on conflict (key) do update set body = excluded.body, updated_at = now();

-- Default learning resources per curriculum domain.
insert into public.domain_materials (domain, materials) values
  ('Numbers and Number Sense', array['Place value chart','Number cards','Counters','Worksheets']),
  ('Patterns and Algebra',     array['Algebra tiles','Pattern strips','Graphing board','Worksheets']),
  ('Geometry',                 array['Geometric solids','Ruler and protractor','Cut-out shapes','Grid paper']),
  ('Measurement',              array['Measuring tape','Unit cubes','Weighing scale','Activity sheets']),
  ('Statistics and Probability', array['Data cards','Graphing paper','Spinner and dice','Chart paper'])
on conflict (domain) do update set materials = excluded.materials, updated_at = now();

-- Lesson templates.
insert into public.lesson_templates (name, approach, description, sections, active, is_default) values
  ('DepEd Daily Lesson Log (DLL)', '4As',
   'The standard DepEd daily lesson log arranged around Activity, Analysis, Abstraction and Application.',
   array['Activity','Analysis','Abstraction','Application'], true, true),
  ('Detailed Lesson Plan (DLP)', '7Es',
   'A detailed plan following the 7E instructional model, best for demonstration and observed teaching.',
   array['Elicit','Engage','Explore','Explain','Elaborate','Evaluate','Extend'], true, false),
  ('Inquiry-Based Math Plan', '5Es',
   'Learner-led investigation model for problem solving and discovery lessons.',
   array['Engage','Explore','Explain','Elaborate','Evaluate'], true, false),
  ('Remediation / Catch-Up Plan', 'Gradual Release',
   'Short-cycle plan for intervention sessions on least-mastered competencies.',
   array['Review','Modelling (I do)','Guided Practice (We do)','Independent Practice (You do)'], false, false)
on conflict (name) do update
  set approach    = excluded.approach,
      description = excluded.description,
      sections    = excluded.sections,
      active      = excluded.active;

-- Grade 3 Mathematics MELCs (DepEd K-12), by quarter:
--   Q1 whole numbers, addition, subtraction
--   Q2 multiplication and division
--   Q3 fractions, geometry (lines & symmetry), number patterns
--   Q4 measurement (time, units, area, perimeter) and data & probability
-- The competency wording follows the DepEd MELC; verify the exact code suffixes
-- against your official MELC copy before a graded submission.
-- Clear any earlier Grade 3 rows so this list is authoritative on a re-run.
delete from public.competencies where grade = 'Grade 3';

insert into public.competencies (code, grade, quarter, domain, description, active) values
  -- Quarter 1 — Numbers and Number Sense
  ('M3NS-Ia-1.3','Grade 3',1,'Numbers and Number Sense','Visualizes and represents numbers from 1001 up to 10 000 using a variety of materials.',true),
  ('M3NS-Ia-9.3','Grade 3',1,'Numbers and Number Sense','Reads and writes numbers up to 10 000 in symbols and in words.',true),
  ('M3NS-Ia-10.3','Grade 3',1,'Numbers and Number Sense','Gives the place value and the value of a digit in 4- to 5-digit numbers.',true),
  ('M3NS-Ib-15.1','Grade 3',1,'Numbers and Number Sense','Rounds numbers to the nearest ten, hundred and thousand.',true),
  ('M3NS-Ic-16.3','Grade 3',1,'Numbers and Number Sense','Compares and orders numbers up to 10 000 using relation symbols.',true),
  ('M3NS-Id-2.2','Grade 3',1,'Numbers and Number Sense','Identifies, reads and writes ordinal numbers from 1st to 100th.',true),
  ('M3NS-Id-22.2','Grade 3',1,'Numbers and Number Sense','Adds 3- to 4-digit numbers up to three addends with sums up to 10 000, with and without regrouping.',true),
  ('M3NS-If-29.3','Grade 3',1,'Numbers and Number Sense','Solves routine and non-routine problems involving addition of whole numbers with sums up to 10 000.',true),
  ('M3NS-Ig-32.6','Grade 3',1,'Numbers and Number Sense','Subtracts 3- to 4-digit numbers with and without regrouping.',true),
  ('M3NS-Ii-34.5','Grade 3',1,'Numbers and Number Sense','Solves routine and non-routine problems involving subtraction of whole numbers.',true),
  -- Quarter 2 — Numbers and Number Sense (multiplication and division)
  ('M3NS-IIa-41.3','Grade 3',2,'Numbers and Number Sense','Visualizes and states the basic multiplication facts for numbers up to 10.',true),
  ('M3NS-IIc-43.6','Grade 3',2,'Numbers and Number Sense','Multiplies 2- to 3-digit numbers by 1-digit numbers with and without regrouping.',true),
  ('M3NS-IIe-45.3','Grade 3',2,'Numbers and Number Sense','Solves routine and non-routine problems involving multiplication of whole numbers.',true),
  ('M3NS-IIf-47','Grade 3',2,'Numbers and Number Sense','Visualizes and states the multiples of 1- to 2-digit numbers.',true),
  ('M3NS-IIg-51.3','Grade 3',2,'Numbers and Number Sense','Visualizes and states the basic division facts of numbers up to 10.',true),
  ('M3NS-IIh-52.3','Grade 3',2,'Numbers and Number Sense','Divides 2- to 3-digit numbers by 1-digit numbers without and with a remainder.',true),
  ('M3NS-IIj-56.2','Grade 3',2,'Numbers and Number Sense','Solves routine and non-routine problems involving division of whole numbers.',true),
  -- Quarter 3 — Fractions, Geometry, Patterns
  ('M3NS-IIIa-63','Grade 3',3,'Numbers and Number Sense','Visualizes and represents fractions that are equal to one and greater than one using regions, sets and the number line.',true),
  ('M3NS-IIIb-76.3','Grade 3',3,'Numbers and Number Sense','Reads and writes fractions that are equal to one and greater than one in symbols and in words.',true),
  ('M3NS-IIIe-72.7','Grade 3',3,'Numbers and Number Sense','Visualizes and generates equivalent fractions.',true),
  ('M3GE-IIIe-11','Grade 3',3,'Geometry','Recognizes and draws a point, line, line segment and ray.',true),
  ('M3GE-IIIf-12.1','Grade 3',3,'Geometry','Recognizes and draws parallel, intersecting and perpendicular lines.',true),
  ('M3GE-IIIg-7.4','Grade 3',3,'Geometry','Identifies and draws the line of symmetry in a given symmetrical figure.',true),
  ('M3AL-IIIi-4','Grade 3',3,'Patterns and Algebra','Determines the missing term(s) in a given continuous or repeating pattern of numbers or figures.',true),
  ('M3AL-IIIj-12','Grade 3',3,'Patterns and Algebra','Finds the missing value in a number sentence involving multiplication or division of whole numbers.',true),
  -- Quarter 4 — Measurement, Statistics and Probability
  ('M3ME-IVa-27','Grade 3',4,'Measurement','Tells and writes time in minutes, including a.m. and p.m., using analog and digital clocks.',true),
  ('M3ME-IVb-39','Grade 3',4,'Measurement','Converts common units of measure of length, mass and capacity from larger to smaller units and vice versa.',true),
  ('M3ME-IVd-43','Grade 3',4,'Measurement','Measures the area of a square and a rectangle using appropriate square units.',true),
  ('M3ME-IVf-46','Grade 3',4,'Measurement','Solves routine and non-routine problems involving the area and perimeter of squares and rectangles.',true),
  ('M3SP-IVg-2.3','Grade 3',4,'Statistics and Probability','Sorts, classifies and organizes data in a table and presents it as a vertical or horizontal bar graph.',true),
  ('M3SP-IVh-3.3','Grade 3',4,'Statistics and Probability','Infers and interprets data presented in a bar graph.',true),
  ('M3SP-IVi-7.3','Grade 3',4,'Statistics and Probability','Tells whether an event is sure, likely, equally likely, unlikely or impossible to happen.',true)
on conflict (code) do update
  set grade       = excluded.grade,
      quarter     = excluded.quarter,
      domain      = excluded.domain,
      description = excluded.description,
      active      = excluded.active;


-- 13. First-time setup helpers ---------------------------------------------

-- Backfill: give every existing Supabase Auth user a public.users row.
-- The on_auth_user_created trigger only runs for NEW sign-ups, so accounts that
-- were created before this file was (re-)run would otherwise have no profile and
-- hit "No profile is linked to this account" on sign in.
insert into public.users (id, email, full_name, school, role, status)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'school', ''),
  coalesce((u.raw_user_meta_data ->> 'role')::public.app_role, 'teacher'),
  'active'
from auth.users u
on conflict (id) do nothing;

-- Make the first administrator. Sign up through the app first, then run:
--   select public.promote_to_admin('you@example.com');
create or replace function public.promote_to_admin(p_email text)
returns public.users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user public.users;
begin
  update public.users
     set role = 'admin', status = 'active'
   where lower(email) = lower(btrim(p_email))
  returning * into v_user;

  if not found then
    raise exception 'No account found for %. Sign up through the app first.', p_email
      using errcode = 'no_data_found';
  end if;
  return v_user;
end;
$$;

comment on function public.promote_to_admin is
  'Bootstrap helper: run once from the SQL Editor to make the first administrator.';

revoke execute on function public.promote_to_admin(text) from public, anon, authenticated;

-- Do NOT auto-confirm accounts here: with "Confirm email" ON, an unconfirmed
-- auth.users row is exactly what should keep an account from signing in.
-- (If you ever run with "Confirm email" OFF and need to unstick accounts
-- created while it was on, run manually:
--   update auth.users set email_confirmed_at = now() where email_confirmed_at is null;)
