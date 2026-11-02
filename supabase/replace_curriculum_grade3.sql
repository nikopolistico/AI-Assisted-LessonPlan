-- =============================================================================
-- Replace the Grade 3 Mathematics curriculum
--
-- Run this in the Supabase SQL Editor, on a database that already went through
-- setup.sql. It is safe to re-run. Do NOT run setup.sql afterwards: it drops
-- everything and restores the old MELC list.
--
-- Clears every record in public.competencies, then inserts the new curriculum.
-- Uses DELETE, not TRUNCATE: lesson_plans has a foreign key to this table, so
-- TRUNCATE ... CASCADE would wipe every lesson plan.
--
-- Saved lesson plans are kept. Their competency_id becomes null (foreign key is
-- ON DELETE SET NULL) and their competency_code still shows the old code.
--
-- How the source maps onto the table:
--   * Term N is stored in the existing `quarter` column (Terms 1 to 3).
--   * Each sentence of a week's competency is one row, so a teacher picks a single
--     competency for a lesson. Wording is kept exactly as in the source.
--   * The source lists no official codes, and `code` is required and unique, so
--     these are local codes: M3-T<term>-W<start week>-<number within that week>.
--     Weeks are zero-padded because the picker sorts on `code` as text.
--
-- Gap in the source: Second Term Week 10 is on page 5, which was not provided,
-- so it has no rows yet.
-- =============================================================================

begin;

delete from public.competencies;

insert into public.competencies (code, grade, quarter, domain, description, active) values

  -- FIRST TERM
  ('M3-T1-W01-1','Grade 3',1,'Measurement and Geometry','Illustrate and estimate the area of a square or rectangle using square tile units.',true),
  ('M3-T1-W01-2','Grade 3',1,'Measurement and Geometry','Explore inductively the derivation of the area formulas for a square and a rectangle using square tile units.',true),
  ('M3-T1-W02-1','Grade 3',1,'Measurement and Geometry','Find the areas of squares and rectangles in sq. cm and sq. m.',true),
  ('M3-T1-W02-2','Grade 3',1,'Measurement and Geometry','Solve problems involving areas of squares and rectangles.',true),
  ('M3-T1-W02-3','Grade 3',1,'Measurement and Geometry','Recognize, using models, and draw a point, line, line segment, and ray.',true),
  ('M3-T1-W03-1','Grade 3',1,'Measurement and Geometry','Recognize and draw parallel, intersecting, and perpendicular lines.',true),
  ('M3-T1-W03-2','Grade 3',1,'Measurement and Geometry','Identify and draw line segments of equal length using a ruler.',true),
  ('M3-T1-W04-1','Grade 3',1,'Number and Algebra','Represent numbers up to 10 000 using pictorial models and numerals.',true),
  ('M3-T1-W05-1','Grade 3',1,'Number and Algebra','Read and write numbers up to 10 000 in numerals and in words.',true),
  ('M3-T1-W06-1','Grade 3',1,'Number and Algebra','Describe the position of objects using ordinal numbers up to 100th.',true),
  -- Weeks 7 to 8
  ('M3-T1-W07-1','Grade 3',1,'Number and Algebra','Determine (a) the place value of a digit in a 4-digit number, (b) the value of a digit, (c) the digit of a number, given its place value.',true),
  ('M3-T1-W09-1','Grade 3',1,'Number and Algebra','Round numbers to the nearest ten, hundred, or thousand.',true),
  ('M3-T1-W09-2','Grade 3',1,'Number and Algebra','Compare numbers up to 10 000 using =, >, and <.',true),
  ('M3-T1-W10-1','Grade 3',1,'Number and Algebra','Order numbers up to 10 000 from smallest to largest, and vice versa.',true),

  -- SECOND TERM
  ('M3-T2-W01-1','Grade 3',2,'Measurement and Geometry','Measure mass in grams (g), kilograms (kg), and/or milligrams (mg) using appropriate measuring tools.',true),
  ('M3-T2-W01-2','Grade 3',2,'Measurement and Geometry','Estimate mass of an object using g, kg, and/or mg.',true),
  ('M3-T2-W01-3','Grade 3',2,'Measurement and Geometry','Compare masses of objects, including the use of a balance scale.',true),
  ('M3-T2-W02-1','Grade 3',2,'Measurement and Geometry','Measure capacity in liters (L) and/or milliliters (mL) using appropriate measuring tools.',true),
  ('M3-T2-W02-2','Grade 3',2,'Measurement and Geometry','Estimate capacity using L and/or mL.',true),
  ('M3-T2-W02-3','Grade 3',2,'Measurement and Geometry','Compare capacities of two containers.',true),
  ('M3-T2-W03-1','Grade 3',2,'Number and Algebra','Read and write money in words and using (a) Philippine currency symbols (₱ and PhP) up to ₱10 000 and (b) the centavo sign.',true),
  ('M3-T2-W03-2','Grade 3',2,'Number and Algebra','Add numbers with sums up to 10 000, with and without regrouping.',true),
  ('M3-T2-W04-1','Grade 3',2,'Number and Algebra','Estimate the sum of addends with up to 4 digits.',true),
  -- Weeks 4 to 5
  ('M3-T2-W04-2','Grade 3',2,'Number and Algebra','Solve problems involving addition of numbers with sums up to 10 000, including problems involving money.',true),
  -- Weeks 5 to 6
  ('M3-T2-W05-1','Grade 3',2,'Number and Algebra','Subtract numbers, where both numbers are less than 10 000, with and without regrouping.',true),
  -- Weeks 6 to 7
  ('M3-T2-W06-1','Grade 3',2,'Number and Algebra','Estimate the difference of two numbers of up to 4 digits.',true),
  ('M3-T2-W06-2','Grade 3',2,'Number and Algebra','Perform addition and subtraction of 3 to 4 numbers of up to 2 digits, observing the correct order of operations.',true),
  ('M3-T2-W08-1','Grade 3',2,'Number and Algebra','Solve problems involving addition and subtraction with 3 to 4 numbers of up to 2 digits, including problems involving money.',true),
  ('M3-T2-W08-2','Grade 3',2,'Data and Probability','Collect data from experiments with a small number of possible outcomes (e.g., rolling a die or tossing a coin).',true),
  ('M3-T2-W09-1','Grade 3',2,'Data and Probability','Present data in tables and single bar graphs (horizontal and vertical).',true),
  ('M3-T2-W09-2','Grade 3',2,'Data and Probability','Interpret data in tables and single bar graphs (horizontal and vertical).',true),
  -- Week 10: on page 5, which was not provided. Add it here when you have it.

  -- THIRD TERM
  ('M3-T3-W01-1','Grade 3',3,'Number and Algebra','Multiply numbers using the 6, 7, 8, and 9 multiplication tables.',true),
  ('M3-T3-W02-1','Grade 3',3,'Number and Algebra','Illustrate and apply properties of multiplication for the 6, 7, 8, and 9 tables: (a) one multiplied by any number is equal to the number; (b) zero multiplied by any number is zero; (c) changing the order of the numbers does not change the product; (d) changing the grouping does not change the product; (e) multiplying the sum of two addends by a number is the same as the sum of the products of the number by each addend.',true),
  ('M3-T3-W03-1','Grade 3',3,'Number and Algebra','Multiply numbers with and without regrouping: (a) 2- to 3-digit numbers by a 1-digit number; (b) 2- to 4-digit numbers by a number whose leading digit is the only non-zero digit, with products up to 10 000.',true),
  ('M3-T3-W03-2','Grade 3',3,'Number and Algebra','Estimate the product of 2- to 3-digit numbers by 1- to 2-digit numbers by estimating the factors using multiples of 10.',true),
  ('M3-T3-W04-1','Grade 3',3,'Number and Algebra','Solve 1- to 2-step multiplication problems, including problems involving money.',true),
  ('M3-T3-W04-2','Grade 3',3,'Number and Algebra','Determine the missing term/s in a pattern with repeating and increasing components or repeating and decreasing components (e.g., 1a, 1b, 1c, 2a, 2b, 2c, …).',true),
  ('M3-T3-W04-3','Grade 3',3,'Number and Algebra','Explain how to generate a given pattern with repeating and increasing components or repeating and decreasing components.',true),
  ('M3-T3-W05-1','Grade 3',3,'Number and Algebra','Illustrate division through equal jumps on the number line and as the inverse of multiplication.',true),
  ('M3-T3-W06-1','Grade 3',3,'Number and Algebra','Divide numbers using the 6, 7, 8, and 9 multiplication tables.',true),
  ('M3-T3-W06-2','Grade 3',3,'Number and Algebra','Find the missing number in a number sentence involving multiplication or division by 6, 7, 8, and 9 (e.g., __ × 7 = 56; 56 ÷ __ = 7).',true),
  ('M3-T3-W07-1','Grade 3',3,'Number and Algebra','Divide numbers with and without remainder: (a) 2- to 3-digit numbers by a 1-digit number without remainder; (b) 2-digit numbers by a 1-digit number with remainder; (c) 2- to 4-digit numbers by 10, 100, and 1000.',true),
  -- Weeks 8 to 9
  ('M3-T3-W08-1','Grade 3',3,'Number and Algebra','Estimate the quotient of 2- to 3-digit numbers divided by 1- to 2-digit numbers, using multiples of 10 or 100 as appropriate.',true),
  ('M3-T3-W08-2','Grade 3',3,'Number and Algebra','Solve division problems involving 2- to 3-digit numbers by a 1-digit number, including problems involving money.',true),
  ('M3-T3-W08-3','Grade 3',3,'Number and Algebra','Represent fractions that are equal to one and greater than one using models.',true),
  ('M3-T3-W08-4','Grade 3',3,'Number and Algebra','Add and subtract similar fractions using models.',true),
  ('M3-T3-W09-1','Grade 3',3,'Measurement and Geometry','Describe and draw the effect of a two-direction multi-step slide (or translation) in basic shapes and figures.',true),
  ('M3-T3-W10-1','Grade 3',3,'Data and Probability','Solve problems using data presented in a single bar graph (horizontal and vertical).',true),
  ('M3-T3-W10-2','Grade 3',3,'Data and Probability','Describe and compare outcomes in real-life situations using the terms equally likely, less/least likely, more/most likely, certain, and impossible.',true);

commit;

-- Result summary, shown in the SQL Editor. Expect 14, 17 and 18.
select 'Term ' || quarter as term, count(*) as competencies
  from public.competencies
 group by quarter
 order by quarter;
