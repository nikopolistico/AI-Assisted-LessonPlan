-- =============================================================================
-- Lesson Plan AI — reference data
--
-- Run after schema.sql. Safe to re-run: every insert is an upsert.
-- Accounts are NOT seeded here — create them through Supabase Auth (dashboard,
-- or the sign-up form), then run the promote_to_admin() helper at the bottom.
-- =============================================================================

-- Section prose used by build_plan_sections(). Keys are lowercase section titles.
insert into public.section_prompts (key, body) values
  ('activity',
   'Open with a hands-on group task on {topic}. Learners work in fours with the prepared materials while you move around and note the strategies they try.'),
  ('analysis',
   'Draw out the thinking behind the activity: What did your group notice about {topic}? Which step gave you difficulty, and why? Chart the responses on the board.'),
  ('abstraction',
   'Formalise the concept. State the rule for {topic} in the learners’ own words first, then in mathematical language, and model three worked examples of increasing difficulty.'),
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
   'Short individual check on {topic}. Collect the responses before dismissal so results can inform tomorrow’s opening drill.'),
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


-- Most Essential Learning Competencies (Mathematics).
select public.import_competencies($json$
[
  {"code":"M1NS-Ia-1","grade":"Grade 1","quarter":1,"domain":"Numbers and Number Sense","description":"Recites numbers from 0 to 100 forward and backward.","active":true},
  {"code":"M2NS-Ib-2","grade":"Grade 2","quarter":1,"domain":"Numbers and Number Sense","description":"Groups objects into tens, hundreds and thousands.","active":true},
  {"code":"M3NS-Ia-1","grade":"Grade 3","quarter":1,"domain":"Numbers and Number Sense","description":"Visualizes and represents numbers from 1001 to 10 000 using a variety of materials.","active":true},
  {"code":"M4NS-Ia-1","grade":"Grade 4","quarter":1,"domain":"Numbers and Number Sense","description":"Visualizes numbers up to 100 000 with emphasis on numbers 10 001 to 100 000.","active":true},
  {"code":"M4NS-IIc-4","grade":"Grade 4","quarter":2,"domain":"Numbers and Number Sense","description":"Identifies proper, improper and mixed fractions using models and number lines.","active":true},
  {"code":"M5NS-Ia-1","grade":"Grade 5","quarter":1,"domain":"Numbers and Number Sense","description":"Visualizes numbers up to 10 000 000 with emphasis on numbers 100 001 to 10 000 000.","active":true},
  {"code":"M5NS-Ib-2","grade":"Grade 5","quarter":1,"domain":"Numbers and Number Sense","description":"Reads and writes numbers up to 10 000 000 in symbols and in words.","active":true},
  {"code":"M5NS-Ic-3","grade":"Grade 5","quarter":1,"domain":"Numbers and Number Sense","description":"Uses divisibility rules for 2, 5 and 10 to find the common factors of numbers.","active":true},
  {"code":"M5NS-IIa-1","grade":"Grade 5","quarter":2,"domain":"Numbers and Number Sense","description":"Adds and subtracts fractions with dissimilar denominators in simple and mixed forms.","active":true},
  {"code":"M5GE-IIIa-1","grade":"Grade 5","quarter":3,"domain":"Geometry","description":"Visualizes, names and describes polygons with five or more sides.","active":true},
  {"code":"M5ME-IVa-1","grade":"Grade 5","quarter":4,"domain":"Measurement","description":"Measures and calculates the volume of a rectangular prism using cubic units.","active":true},
  {"code":"M6NS-Ia-1","grade":"Grade 6","quarter":1,"domain":"Numbers and Number Sense","description":"Adds and subtracts simple fractions and mixed numbers without and with regrouping.","active":true},
  {"code":"M6NS-Ie-5","grade":"Grade 6","quarter":1,"domain":"Numbers and Number Sense","description":"Multiplies and divides decimals up to 2 decimal places.","active":true},
  {"code":"M6AL-IIb-1","grade":"Grade 6","quarter":2,"domain":"Patterns and Algebra","description":"Formulates the rule in finding the next term in a sequence.","active":true},
  {"code":"M6SP-IVb-2","grade":"Grade 6","quarter":4,"domain":"Statistics and Probability","description":"Constructs and interprets a pie graph based on a given set of data.","active":true},
  {"code":"M7NS-Ia-1","grade":"Grade 7","quarter":1,"domain":"Numbers and Number Sense","description":"Describes well-defined sets, subsets, universal sets and the null set.","active":true},
  {"code":"M7AL-IIc-1","grade":"Grade 7","quarter":2,"domain":"Patterns and Algebra","description":"Translates English phrases into mathematical phrases and vice versa.","active":true},
  {"code":"M8AL-Ia-1","grade":"Grade 8","quarter":1,"domain":"Patterns and Algebra","description":"Factors completely different types of polynomials.","active":true},
  {"code":"M9AL-Ia-1","grade":"Grade 9","quarter":1,"domain":"Patterns and Algebra","description":"Illustrates quadratic equations in one variable.","active":true},
  {"code":"M10AL-Ia-1","grade":"Grade 10","quarter":1,"domain":"Patterns and Algebra","description":"Generates patterns from arithmetic and geometric sequences.","active":false}
]
$json$::jsonb);


-- -----------------------------------------------------------------------------
-- Helpers for first-time setup
-- -----------------------------------------------------------------------------

-- import_competencies() requires an admin caller, so the seed above will fail
-- with "Administrator access is required" if you run it as a signed-in teacher.
-- Run it as the postgres/service role (SQL Editor and `supabase db reset` both
-- do), or bootstrap your first admin with the helper below.

create or replace function public.promote_to_admin(p_email text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  update public.profiles
     set role = 'admin', status = 'active'
   where lower(email) = lower(btrim(p_email))
  returning * into v_profile;

  if not found then
    raise exception 'No profile found for %. Create the auth user first.', p_email
      using errcode = 'no_data_found';
  end if;
  return v_profile;
end;
$$;

comment on function public.promote_to_admin is
  'Bootstrap helper: run once from the SQL Editor to make the first administrator.';

revoke execute on function public.promote_to_admin(text) from public, anon, authenticated;

-- After creating the account in Authentication -> Users, run:
--   select public.promote_to_admin('admin@lessonplan.ph');
-- Then approve teachers from the admin UI, or:
--   select public.approve_user(id) from public.profiles where status = 'pending';
