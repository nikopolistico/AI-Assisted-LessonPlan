import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import type { Role, User } from '@/types'
import { supabase } from '@/lib/supabase'
import { toUser } from '@/lib/mappers'

/** Drives the full-screen sign-in / sign-out progress overlay. */
export type AuthStatus =
  'idle' | 'verifying' | 'loading-profile' | 'success' | 'failed' | 'signing-out' | 'signed-out'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const currentUser = ref<User | null>(null)
  const ready = ref(false)
  const error = ref('')
  const pending = ref(false)
  const status = ref<AuthStatus>('idle')

  const isAuthenticated = computed(() => currentUser.value !== null)
  const role = computed<Role | null>(() => currentUser.value?.role ?? null)
  const userId = computed(() => currentUser.value?.id ?? null)

  let markReady!: () => void
  const readyPromise = new Promise<void>((resolve) => {
    markReady = resolve
  })

  /** Resolves once the initial session has been checked — used by the router guard. */
  function ensureReady() {
    return readyPromise
  }

  async function fetchProfile(uid: string): Promise<User | null> {
    const { data } = await supabase.from('users').select('*').eq('id', uid).single()
    return data ? toUser(data) : null
  }

  async function syncSession(next: Session | null) {
    session.value = next
    currentUser.value = next ? await fetchProfile(next.user.id) : null
  }

  supabase.auth
    .getSession()
    .then(({ data }) => syncSession(data.session))
    .finally(() => {
      ready.value = true
      markReady()
    })

  supabase.auth.onAuthStateChange((_event, next) => {
    void syncSession(next)
  })

  /** Turns Supabase's raw sign-in errors into something a teacher can act on. */
  function describeSignInError(message?: string) {
    const m = (message ?? '').toLowerCase()
    if (m.includes('email not confirmed')) {
      return 'This email address has not been confirmed yet. Ask your administrator to confirm the account.'
    }
    if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
    return message || 'Sign in failed. Please try again.'
  }

  function fail(message: string) {
    pending.value = false
    error.value = message
    status.value = 'failed'
    return null
  }

  function clearStatus() {
    status.value = 'idle'
  }

  async function login(email: string, password: string) {
    pending.value = true
    error.value = ''
    status.value = 'verifying'

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.session) return fail(describeSignInError(signInError?.message))

    status.value = 'loading-profile'
    const profile = await fetchProfile(data.user.id)

    if (!profile) {
      await supabase.auth.signOut()
      return fail('No profile is linked to this account. Contact your division administrator.')
    }
    if (profile.status === 'disabled') {
      await supabase.auth.signOut()
      return fail('This account has been disabled. Contact your division administrator.')
    }

    session.value = data.session
    currentUser.value = profile
    await supabase.rpc('record_login')

    pending.value = false
    status.value = 'success'
    return profile
  }

  async function logout() {
    status.value = 'signing-out'
    await supabase.auth.signOut()
    currentUser.value = null
    session.value = null
    error.value = ''
    status.value = 'signed-out'
  }

  return {
    session,
    currentUser,
    userId,
    ready,
    isAuthenticated,
    role,
    error,
    pending,
    status,
    clearStatus,
    ensureReady,
    login,
    logout,
  }
})
