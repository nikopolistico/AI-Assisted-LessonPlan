/**
 * Server-side proxy for lesson-plan generation. Runs as a Vercel Edge Function
 * so it can hold the OpenAI-compatible API key as a secret and stream the
 * response back — the browser can never call api.openai.com directly, since
 * OpenAI does not send CORS headers permitting cross-origin browser requests.
 *
 * Configure with plain (non-VITE_) env vars in the Vercel project settings:
 *   OPENAI_API_KEY   required
 *   OPENAI_MODEL     optional, defaults to gpt-4o-mini
 *   OPENAI_BASE_URL  optional, defaults to https://api.openai.com/v1
 *                    (point at an OpenAI-compatible gateway, e.g. OpenRouter)
 */
export const config = { runtime: 'edge' }

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return json(500, { error: 'The server is missing OPENAI_API_KEY.' })

  let body: { messages?: unknown; stream?: boolean }
  try {
    body = (await request.json()) as { messages?: unknown; stream?: boolean }
  } catch {
    return json(400, { error: 'Invalid JSON body.' })
  }
  if (!Array.isArray(body.messages)) return json(400, { error: 'Missing "messages" array.' })

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const host = new URL(baseUrl).hostname
  const isNativeOpenAI = /(^|\.)api\.openai\.com$/.test(host)
  const isOpenRouter = /(^|\.)openrouter\.ai$/.test(host)
  const stream = Boolean(body.stream)

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(isOpenRouter
        ? { 'HTTP-Referer': request.headers.get('origin') ?? '', 'X-Title': 'Lesson Plan AI' }
        : {}),
    },
    body: JSON.stringify({
      model,
      ...(stream ? { stream: true } : {}),
      ...(isNativeOpenAI ? { temperature: 0.7 } : {}),
      // OpenRouter-specific: makes the model think before answering, even on
      // models that don't reason by default. readSseStream() already displays
      // the resulting reasoning delta during the typewriter stream.
      ...(isOpenRouter ? { reasoning: { enabled: true } } : {}),
      messages: body.messages,
    }),
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}
