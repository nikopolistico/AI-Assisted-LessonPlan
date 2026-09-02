import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role, User } from '@/types'
import { seedUsers } from '@/data/seed'
import { clearState, loadState, saveState } from '@/lib/persist'
import { useUsersStore } from './users'

const KEY = 'alp.session'

/** Demo credential — every seeded account accepts it. */
export const DEMO_PASSWORD = 'lessonplan'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(loadState<string | null>(KEY, null))
  const error = ref('')
  const pending = ref(false)

  const users = useUsersStore()

  const currentUser = computed<User | null>(
    () =>
      users.all.find((u) => u.id === userId.value) ??
      seedUsers.find((u) => u.id === userId.value) ??
      null,
  )
  const isAuthenticated = computed(() => currentUser.value !== null)
  const role = computed<Role | null>(() => currentUser.value?.role ?? null)

  async function login(email: string, password: string) {
    pending.value = true
    error.value = ''
    await new Promise((r) => setTimeout(r, 550))

    const match = users.all.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    pending.value = false

    if (!match || password !== DEMO_PASSWORD) {
      error.value = 'Incorrect email or password.'
      return null
    }
    if (match.status === 'disabled') {
      error.value = 'This account has been disabled. Contact your division administrator.'
      return null
    }
    if (match.status === 'pending') {
      error.value = 'This account is still awaiting administrator approval.'
      return null
    }

    userId.value = match.id
    saveState(KEY, match.id)
    users.markLogin(match.id)
    return match
  }

  function logout() {
    userId.value = null
    error.value = ''
    clearState(KEY)
  }

  return { userId, currentUser, isAuthenticated, role, error, pending, login, logout }
})
