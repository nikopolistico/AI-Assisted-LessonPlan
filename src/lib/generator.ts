import type { Competency, LessonPlan, LessonRequest, LessonSection, LessonTemplate } from '@/types'

/**
 * Stand-in for the lesson generation service. It composes a complete plan from the
 * chosen template, the selected MELC and the teacher's inputs, so the screens behave
 * exactly as they will once a real model is wired in behind the same call signature.
 */

const VERB_BANK = ['Identify', 'Demonstrate', 'Apply', 'Explain', 'Construct', 'Compare']

const SECTION_PROMPTS: Record<string, string> = {
  activity:
    'Open with a hands-on group task on {topic}. Learners work in fours with the prepared materials while you move around and note the strategies they try.',
  analysis:
    'Draw out the thinking behind the activity: What did your group notice about {topic}? Which step gave you difficulty, and why? Chart the responses on the board.',
  abstraction:
    'Formalise the concept. State the rule for {topic} in the learners’ own words first, then in mathematical language, and model three worked examples of increasing difficulty.',
  application:
    'Learners apply {topic} to a real-life situation drawn from the community, then explain their solution to a seatmate before writing it down.',
  elicit:
    'Two-minute drill on the prerequisite skill for {topic} to surface what learners already carry into the lesson.',
  engage:
    'Present a short situation or puzzle about {topic} that has no obvious answer, and let learners predict before any instruction begins.',
  explore:
    'Groups investigate {topic} with the manipulatives provided, recording what they observe on a shared table. Circulate and ask probing questions instead of giving answers.',
  explain:
    'Groups report their findings. Guide the class from their observations to the formal statement of {topic}, correcting misconceptions as they surface.',
  elaborate:
    'Extend {topic} to a less familiar case, including one problem where the given information is incomplete so learners must reason about what is missing.',
  evaluate:
    'Short individual check on {topic}. Collect the responses before dismissal so results can inform tomorrow’s opening drill.',
  extend:
    'Challenge task for early finishers: pose a problem on {topic} with more than one valid approach and ask learners to justify the one they picked.',
  review:
    'Revisit the prerequisite skill for {topic} with a five-item board drill, calling on learners who struggled in the previous session.',
  'modelling (i do)':
    'Think aloud through two examples of {topic}, naming each decision as you make it so learners hear the reasoning, not only the steps.',
  'guided practice (we do)':
    'Work through {topic} together. Learners write each step on their boards and hold them up so you can spot errors immediately.',
  'independent practice (you do)':
    'Learners complete a short set on {topic} on their own while you conference with the two or three who need the most support.',
}

const MATERIALS_BANK: Record<string, string[]> = {
  'Numbers and Number Sense': ['Place value chart', 'Number cards', 'Counters', 'Worksheets'],
  'Patterns and Algebra': ['Algebra tiles', 'Pattern strips', 'Graphing board', 'Worksheets'],
  Geometry: ['Geometric solids', 'Ruler and protractor', 'Cut-out shapes', 'Grid paper'],
  Measurement: ['Measuring tape', 'Unit cubes', 'Weighing scale', 'Activity sheets'],
  'Statistics and Probability': ['Data cards', 'Graphing paper', 'Spinner and dice', 'Chart paper'],
}

function splitMinutes(total: number, parts: number): number[] {
  const base = Math.floor(total / parts)
  const out = Array.from({ length: parts }, () => base)
  let remainder = total - base * parts
  let i = 0
  while (remainder > 0) {
    out[i % parts] = (out[i % parts] ?? base) + 1
    remainder -= 1
    i += 1
  }
  return out
}

function buildSections(template: LessonTemplate, topic: string, duration: number): LessonSection[] {
  const minutes = splitMinutes(duration, template.sections.length)
  return template.sections.map((title, index) => {
    const key = title.toLowerCase()
    const prompt =
      SECTION_PROMPTS[key] ??
      'Guide learners through {topic} using the materials prepared for this section.'
    return {
      key: key.replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
      title,
      minutes: minutes[index] ?? 0,
      body: prompt.replaceAll('{topic}', topic),
    }
  })
}

function buildObjectives(competency: Competency, topic: string, seed: number): string[] {
  const verb = VERB_BANK[seed % VERB_BANK.length] ?? 'Apply'
  const trimmed = competency.description.replace(/\.$/, '')
  return [
    `${trimmed}.`,
    `${verb} the concept of ${topic} in guided and independent practice.`,
    `Show accuracy and perseverance when working on ${topic}.`,
  ]
}

export interface GenerateArgs {
  request: LessonRequest
  competency: Competency
  template: LessonTemplate
  ownerId: string
  /** Supplied when regenerating so the plan keeps its identity and history. */
  existing?: LessonPlan
}

export function composePlan({
  request,
  competency,
  template,
  ownerId,
  existing,
}: GenerateArgs): LessonPlan {
  const stamp = new Date().toISOString()
  const seed = (existing?.generationCount ?? 0) + 1
  const topic = request.topic.trim() || competency.description

  return {
    id: existing?.id ?? `p-${Math.random().toString(36).slice(2, 9)}`,
    title: existing?.title && seed > 1 ? existing.title : toTitle(topic),
    topic,
    competencyId: competency.id,
    competencyCode: competency.code,
    grade: request.grade,
    quarter: request.quarter,
    duration: request.duration,
    templateId: template.id,
    templateName: template.name,
    ownerId,
    status: 'draft',
    objectives: buildObjectives(competency, topic, seed),
    materials: MATERIALS_BANK[competency.domain] ?? [
      'Chalk and board',
      'Worksheets',
      'Visual aids',
    ],
    sections: buildSections(template, topic, request.duration),
    assessment: `Short ${Math.max(5, Math.round(request.duration / 10))}-item check on ${topic}, with mastery set at 80%.${
      request.learners ? ` Differentiate for ${request.learners.toLowerCase()}.` : ''
    }`,
    assignment: `Answer the practice set on ${topic} in the Learners Material and bring one real-life example to the next meeting.`,
    remarks: request.notes.trim(),
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
    generationCount: seed,
  }
}

function toTitle(topic: string): string {
  const clean = topic.trim().replace(/\.$/, '')
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/** Mimics the round trip to the generation service. */
export function generatePlan(args: GenerateArgs, delay = 1400): Promise<LessonPlan> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(composePlan(args)), delay)
  })
}
