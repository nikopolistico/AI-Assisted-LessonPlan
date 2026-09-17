/**
 * Client-side lesson-plan generation through an OpenAI-compatible chat API.
 *
 * Works with the OpenAI API directly or any compatible gateway (OpenRouter, …)
 * via `VITE_OPENAI_BASE_URL`. The key is read from `VITE_OPENAI_API_KEY` and the
 * request is made straight from the browser, so this is only appropriate for
 * local or single-school use where the deployed bundle is not public. For a
 * public deployment, move this call behind a Supabase Edge Function and keep the
 * key as a server secret.
 */
import type { Competency, LessonRequest, LessonSection, LessonTemplate } from '@/types'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
const model = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'

/** The model id the generator talks to — shown on the Generate screen. */
export const generatorModel = model

/**
 * Defaults to OpenAI. Point this at another host (with no trailing slash) to use
 * an OpenAI-compatible provider — e.g. https://openrouter.ai/api/v1.
 */
const baseUrl = (
  (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) || 'https://api.openai.com/v1'
).replace(/\/$/, '')

const host = new URL(baseUrl).hostname
/** OpenAI-only request fields (JSON mode) are skipped for third-party gateways. */
const isNativeOpenAI = /(^|\.)api\.openai\.com$/.test(host)
const isOpenRouter = /(^|\.)openrouter\.ai$/.test(host)

/** True once an API key is present. Screens fall back to a clear error otherwise. */
export const isOpenAIConfigured = Boolean(apiKey)

if (!isOpenAIConfigured && import.meta.env.DEV) {
  console.warn('[openai] VITE_OPENAI_API_KEY is not set — lesson generation will fail.')
}

export interface LessonPlanContent {
  title: string
  objectives: string[]
  materials: string[]
  sections: LessonSection[]
  assessment: string
  assignment: string
}

export interface ComposeArgs {
  request: LessonRequest
  competency: Competency
  template: LessonTemplate
  /** Present when regenerating, so the model can vary its output. */
  attempt?: number
}

function splitMinutes(total: number, parts: number): number[] {
  if (parts <= 0) return []
  const base = Math.floor(total / parts)
  const out = Array.from({ length: parts }, () => base)
  let remainder = total - base * parts
  for (let i = 0; remainder > 0; i += 1, remainder -= 1) out[i % parts] = (out[i % parts] ?? base) + 1
  return out
}

const GRADE_AGES: Record<string, string> = {
  '1': '6–7',
  '2': '7–8',
  '3': '8–9',
  '4': '9–10',
  '5': '10–11',
  '6': '11–12',
}

function buildPrompt({ request, competency, template, attempt }: ComposeArgs): string {
  const minutes = splitMinutes(request.duration, template.sections.length)
  const sectionList = template.sections
    .map((title, i) => `  ${i + 1}. ${title} (~${minutes[i]} minutes)`)
    .join('\n')
  const gradeNum = request.grade.replace(/\D/g, '') || '3'
  const ages = GRADE_AGES[gradeNum] ?? '8–9'

  return [
    `You are an experienced Philippine public-school Mathematics teacher writing a DepEd daily lesson plan.`,
    ``,
    `Grade level: ${request.grade}`,
    `Quarter: ${request.quarter}`,
    `Topic: ${request.topic.trim()}`,
    `Most Essential Learning Competency (${competency.code}, ${competency.domain}): ${competency.description}`,
    `Total teaching time: ${request.duration} minutes`,
    `Instructional model: ${template.name} — ${template.approach}. ${template.description}`,
    `Lesson parts, in order, with their time budget:`,
    sectionList,
    request.learners.trim() ? `Learner considerations: ${request.learners.trim()}` : ``,
    request.notes.trim() ? `Teacher notes: ${request.notes.trim()}` : ``,
    attempt && attempt > 1
      ? `This is regeneration attempt ${attempt}. Produce a fresh take with different activities.`
      : ``,
    ``,
    `Keep EVERYTHING at ${request.grade} level (pupils about ${ages} years old):`,
    `- Stay strictly within the competency above. Use only the numbers, operations and`,
    `  ideas it covers — never introduce harder concepts, fractions, decimals, algebra,`,
    `  variables or symbols the pupils have not met.`,
    `- Concrete and hands-on first: counters, bottle caps, popsicle sticks, play money,`,
    `  number lines, drawings, songs and group games.`,
    `- Use everyday Filipino situations a young child knows — sari-sari store, baon,`,
    `  jeepney fare, marbles, fruits, classroom seats.`,
    `- Short, simple sentences a Grade ${gradeNum} pupil could read aloud. No jargon.`,
    `- Activities must work in a large public-school class with few materials.`,
    ``,
    `Write the lesson plan in EXACTLY this plain-text layout. No JSON, no markdown,`,
    `no bold, no headings other than the labels shown.`,
    ``,
    `TITLE: <one short, classroom-friendly line>`,
    ``,
    `OBJECTIVES:`,
    `- <specific, measurable objective>`,
    `- <2 to 4 in total>`,
    ``,
    `MATERIALS:`,
    `- <concrete material a teacher can prepare>`,
    `- <a few items>`,
    ``,
    `SECTION: <lesson part name> | <minutes> min`,
    `<2 to 5 sentences of concrete teacher moves for this part>`,
    ``,
    `(repeat the SECTION block for every lesson part listed above, in the same order)`,
    ``,
    `ASSESSMENT:`,
    `<how learning is checked, with a mastery target>`,
    ``,
    `ASSIGNMENT:`,
    `<the take-home task>`,
    ``,
    `Write in short, simple English for Filipino Grade ${gradeNum} pupils (${ages} years old).`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface ParsedPlan {
  title: string
  objectives: string[]
  materials: string[]
  sections: { minutes: number; body: string }[]
  assessment: string
  assignment: string
}

/** Parses the labelled plain-text layout that buildPrompt asks the model for. */
function parseLessonText(raw: string): ParsedPlan {
  const out: ParsedPlan = {
    title: '',
    objectives: [],
    materials: [],
    sections: [],
    assessment: '',
    assignment: '',
  }
  const assessment: string[] = []
  const assignment: string[] = []
  let bucket: 'none' | 'objectives' | 'materials' | 'section' | 'assessment' | 'assignment' = 'none'
  let sectionBody: string[] = []

  const flushSection = () => {
    if (bucket === 'section' && out.sections.length) {
      out.sections[out.sections.length - 1]!.body = sectionBody.join(' ').replace(/\s+/g, ' ').trim()
    }
    sectionBody = []
  }

  for (const rawLine of raw.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim().replace(/^\*\*|\*\*$/g, '')
    const section = line.match(/^SECTION\s*:\s*(.*)$/i)
    const label = line.match(/^(TITLE|OBJECTIVES|MATERIALS|ASSESSMENT|ASSIGNMENT)\s*:\s*(.*)$/i)

    if (section) {
      flushSection()
      const minutes = section[1]?.match(/(\d+)\s*min/i)
      out.sections.push({ minutes: minutes ? Number(minutes[1]) : 0, body: '' })
      bucket = 'section'
      continue
    }
    if (label) {
      flushSection()
      const key = label[1]!.toUpperCase()
      const inline = (label[2] ?? '').trim()
      if (key === 'TITLE') {
        out.title = inline
        bucket = 'none'
      } else if (key === 'OBJECTIVES') {
        bucket = 'objectives'
      } else if (key === 'MATERIALS') {
        bucket = 'materials'
      } else if (key === 'ASSESSMENT') {
        bucket = 'assessment'
        if (inline) assessment.push(inline)
      } else {
        bucket = 'assignment'
        if (inline) assignment.push(inline)
      }
      continue
    }
    if (!line) continue

    const item = line.replace(/^[-*•]\s*/, '').trim()
    if (bucket === 'objectives') out.objectives.push(item)
    else if (bucket === 'materials') out.materials.push(item)
    else if (bucket === 'section') sectionBody.push(line)
    else if (bucket === 'assessment') assessment.push(line)
    else if (bucket === 'assignment') assignment.push(line)
  }
  flushSection()

  out.assessment = assessment.join(' ').replace(/\s+/g, ' ').trim()
  out.assignment = assignment.join(' ').replace(/\s+/g, ' ').trim()
  return out
}

function toSectionKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Reads a Server-Sent-Events stream. `onChunk` receives the running display text
 * (reasoning + answer, for the typewriter); the return value is only the answer
 * content, which is what gets parsed as JSON.
 */
async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (display: string) => void,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  let display = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue // skips SSE comments / blank lines
      const data = trimmed.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string; reasoning?: string } }[]
        }
        const delta = json.choices?.[0]?.delta
        if (typeof delta?.reasoning === 'string' && delta.reasoning) {
          display += delta.reasoning
          onChunk(display)
        }
        if (typeof delta?.content === 'string' && delta.content) {
          content += delta.content
          display += delta.content
          onChunk(display)
        }
      } catch {
        // A data line split across chunks — the next read completes it.
      }
    }
  }
  return content
}

/**
 * Generates a lesson plan. Pass `onChunk` to stream the model's output as it
 * arrives (the Generate screen uses this for its typewriter view).
 */
export async function composeLessonPlan(
  args: ComposeArgs,
  onChunk?: (full: string) => void,
): Promise<LessonPlanContent> {
  if (!apiKey) {
    throw new Error(
      'The lesson generator is not configured. Add VITE_OPENAI_API_KEY to your .env.local and restart the dev server.',
    )
  }

  const stream = typeof onChunk === 'function'

  // Content is sent as an array of parts: OpenAI accepts it, and third-party
  // gateways such as kie.ai require it.
  const textMessage = (role: 'system' | 'user', text: string) => ({
    role,
    content: [{ type: 'text', text }],
  })

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // Optional attribution headers OpenRouter uses for its app rankings.
      ...(isOpenRouter && typeof window !== 'undefined'
        ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'Lesson Plan AI' }
        : {}),
    },
    body: JSON.stringify({
      model,
      ...(stream ? { stream: true } : {}),
      ...(isNativeOpenAI ? { temperature: 0.7 } : {}),
      messages: [
        textMessage(
          'system',
          'You are a Philippine public-school Mathematics teacher. Produce complete, ready-to-teach DepEd lesson plans in the exact labelled plain-text layout the user specifies. Never use JSON or markdown formatting.',
        ),
        textMessage('user', buildPrompt(args)),
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Lesson generation request failed (${response.status}). ${
        detail.slice(0, 200) || 'Check your API key, model name and credit balance.'
      }`,
    )
  }

  let raw: string | undefined
  if (stream && response.body) {
    raw = await readSseStream(response.body, onChunk!)
  } else {
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    raw = payload.choices?.[0]?.message?.content
  }
  if (!raw) throw new Error('The model returned an empty response.')

  const parsed = parseLessonText(raw)
  if (!parsed.title && !parsed.objectives.length && !parsed.sections.length) {
    throw new Error('The model replied in an unexpected format. Try generating again.')
  }

  const minutes = splitMinutes(args.request.duration, args.template.sections.length)
  const sections: LessonSection[] = args.template.sections.map((title, index) => {
    const match = parsed.sections[index]
    return {
      key: toSectionKey(title),
      title,
      minutes: match?.minutes || minutes[index] || 0,
      body: match?.body?.trim() || `Guide learners through ${args.request.topic}.`,
    }
  })

  return {
    title: parsed.title || args.request.topic,
    objectives: parsed.objectives.filter(Boolean),
    materials: parsed.materials.filter(Boolean),
    sections,
    assessment: parsed.assessment,
    assignment: parsed.assignment,
  }
}
