import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import lessonPlanHandler from './api/lesson-plan.ts'

/**
 * Runs api/lesson-plan.ts's own handler under `npm run dev` too. That file is
 * a Vercel Edge Function, outside Vite's normal build, so without this it
 * only exists once deployed (or under `vercel dev`) — this adapts Vite's
 * Node-style req/res to the Web Request/Response the handler expects, so
 * plain `npm run dev` can exercise the exact same code Vercel runs.
 */
function lessonPlanDevApi(): Plugin {
  return {
    name: 'lesson-plan-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/lesson-plan', async (req, res) => {
        const method = (req.method ?? 'GET').toUpperCase()
        const hasBody = method !== 'GET' && method !== 'HEAD'
        const chunks: Buffer[] = []
        if (hasBody) for await (const chunk of req) chunks.push(chunk as Buffer)

        const headers = new Headers()
        const contentType = req.headers['content-type']
        if (contentType) headers.set('content-type', Array.isArray(contentType) ? contentType[0]! : contentType)
        headers.set('origin', `http://${req.headers.host ?? 'localhost'}`)

        const request = new Request(`http://localhost${req.url}`, {
          method,
          headers,
          ...(hasBody ? { body: Buffer.concat(chunks) } : {}),
        })

        const response = await lessonPlanHandler(request)
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        if (!response.body) {
          res.end()
          return
        }
        const reader = response.body.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loads every var from .env.local (not just VITE_-prefixed ones) into
  // process.env, so the dev-only middleware above can read OPENAI_API_KEY
  // the same way the deployed Vercel Edge Function does.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [vue(), vueDevTools(), tailwindcss(), lessonPlanDevApi()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
