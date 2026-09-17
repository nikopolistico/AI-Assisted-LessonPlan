import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True once both environment variables are set. The app still runs on its
 * localStorage stores when Supabase is not configured, so screens can be
 * demonstrated without a project.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — falling back to local data.',
  )
}

export const supabase = createClient<Database>(url ?? 'http://localhost', anonKey ?? 'anon', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * A second, unpersisted client used only to create teacher accounts from the
 * admin dashboard. `auth.signUp` on the main client would swap the caller's
 * own session for the new account's session as soon as it succeeds — this
 * client keeps its own (never-saved) session so registering a teacher can't
 * sign the admin out of theirs.
 */
export const supabaseAdminAuth = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'anon',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)
