import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Role, User, UserStatus } from '@/types'
import { seedUsers } from '@/data/seed'
import { loadState, saveState } from '@/lib/persist'

const KEY = 'alp.users'

export type UserDraft = Omit<User, 'id' | 'createdAt' | 'lastLogin'>

export const useUsersStore = defineStore('users', () => {
  const all = ref<User[]>(loadState<User[]>(KEY, seedUsers))

  watch(all, (value) => saveState(KEY, value), { deep: true })

  const teachers = computed(() => all.value.filter((u) => u.role === 'teacher'))
  const admins = computed(() => all.value.filter((u) => u.role === 'admin'))
  const pendingCount = computed(() => all.value.filter((u) => u.status === 'pending').length)
  const activeCount = computed(() => all.value.filter((u) => u.status === 'active').length)

  function byId(id: string) {
    return all.value.find((u) => u.id === id) ?? null
  }

  function create(draft: UserDraft) {
    const user: User = {
      ...draft,
      id: `u-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    }
    all.value = [user, ...all.value]
    return user
  }

  function update(id: string, patch: Partial<User>) {
    all.value = all.value.map((u) => (u.id === id ? { ...u, ...patch } : u))
  }

  function setStatus(id: string, status: UserStatus) {
    update(id, { status })
  }

  function setRole(id: string, role: Role) {
    update(id, { role })
  }

  function remove(id: string) {
    all.value = all.value.filter((u) => u.id !== id)
  }

  function markLogin(id: string) {
    update(id, { lastLogin: new Date().toISOString() })
  }

  function reset() {
    all.value = seedUsers
  }

  return {
    all,
    teachers,
    admins,
    pendingCount,
    activeCount,
    byId,
    create,
    update,
    setStatus,
    setRole,
    remove,
    markLogin,
    reset,
  }
})
