import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role, User, UserStatus } from '@/types'
import { supabase, supabaseAdminAuth } from '@/lib/supabase'
import { toUser } from '@/lib/mappers'

export type UserDraft = Omit<User, 'id' | 'createdAt' | 'lastLogin'>

export interface RegisterTeacherInput {
  fullName: string
  email: string
  school: string
  password: string
  gradeLevels: string[]
}

/**
 * Accounts, read from `public.users`. Row Level Security returns every row to
 * an admin and only the caller's own row to a teacher.
 */
export const useUsersStore = defineStore('users', () => {
  const all = ref<User[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (fetchError) error.value = fetchError.message
    else all.value = data.map(toUser)
    loading.value = false
  }

  const teachers = computed(() => all.value.filter((u) => u.role === 'teacher'))
  const admins = computed(() => all.value.filter((u) => u.role === 'admin'))
  const pendingCount = computed(() => all.value.filter((u) => u.status === 'pending').length)
  const activeCount = computed(() => all.value.filter((u) => u.status === 'active').length)

  function byId(id: string) {
    return all.value.find((u) => u.id === id) ?? null
  }

  function replace(row: User) {
    all.value = all.value.map((u) => (u.id === row.id ? row : u))
  }

  /** Editable profile fields. Role and status go through the RPCs below. */
  async function update(id: string, patch: Partial<User>) {
    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        full_name: patch.name,
        school: patch.school,
        grade_levels: patch.gradeLevels,
      })
      .eq('id', id)
      .select()
      .single()
    if (updateError || !data)
      throw new Error(updateError?.message ?? 'The account could not be saved.')
    replace(toUser(data))
  }

  async function setStatus(id: string, status: UserStatus) {
    const { data, error: rpcError } =
      status === 'active'
        ? await supabase.rpc('approve_user', { p_user_id: id })
        : await supabase.rpc('set_user_status', { p_user_id: id, p_status: status })
    if (rpcError || !data) throw new Error(rpcError?.message ?? 'The status could not be changed.')
    replace(toUser(data))
  }

  async function setRole(id: string, role: Role) {
    const { data, error: rpcError } = await supabase.rpc('set_user_role', {
      p_user_id: id,
      p_role: role,
    })
    if (rpcError || !data) throw new Error(rpcError?.message ?? 'The role could not be changed.')
    replace(toUser(data))
  }

  /**
   * Creates a teacher account from the admin dashboard. Uses `supabaseAdminAuth`
   * (see src/lib/supabase.ts) so the new account's session never replaces the
   * calling admin's own session.
   */
  async function registerTeacher(input: RegisterTeacherInput) {
    const { data, error: signUpError } = await supabaseAdminAuth.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { full_name: input.fullName.trim(), school: input.school.trim(), role: 'teacher' },
      },
    })
    await supabaseAdminAuth.auth.signOut()

    if (signUpError) throw new Error(signUpError.message)
    // Supabase returns a "successful" response with no identities for an email
    // that is already registered, rather than an error, to avoid leaking which
    // emails exist.
    if (!data.user || data.user.identities?.length === 0) {
      throw new Error('An account with that email already exists.')
    }

    if (input.gradeLevels.length) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ grade_levels: input.gradeLevels })
        .eq('id', data.user.id)
      if (updateError) throw new Error(updateError.message)
    }

    await fetchAll()
    return data.user.id
  }

  async function remove(id: string) {
    const { error: deleteError } = await supabase.from('users').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    all.value = all.value.filter((u) => u.id !== id)
  }

  return {
    all,
    loading,
    error,
    fetchAll,
    teachers,
    admins,
    pendingCount,
    activeCount,
    byId,
    update,
    setStatus,
    setRole,
    registerTeacher,
    remove,
  }
})
