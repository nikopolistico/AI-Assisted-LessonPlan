<script setup lang="ts">
import ResultDialog from '@/components/app/ResultDialog.vue'
import { useResult } from '@/composables/useResult'
import { computed, reactive, ref, watch } from 'vue'
import {
  Ban,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GRADE_LEVELS } from '@/data/seed'
import type { Role, User, UserStatus } from '@/types'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { formatDate, initials } from '@/lib/format'
import {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  SCHOOL_MAX,
  generatePassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validateSchool,
} from '@/lib/validators'

const users = useUsersStore()
const auth = useAuthStore()

const tab = ref('accounts')

const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.all.filter((user) => {
    if (roleFilter.value !== 'all' && user.role !== roleFilter.value) return false
    if (statusFilter.value !== 'all' && user.status !== statusFilter.value) return false
    if (!q) return true
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.school.toLowerCase().includes(q)
    )
  })
})

const statusVariant: Record<UserStatus, 'success' | 'warning' | 'outline'> = {
  active: 'success',
  pending: 'warning',
  disabled: 'outline',
}

// --- Edit -----------------------------------------------------------------
// New accounts are created through the sign-up form on the login screen (they
// need a Supabase Auth user); admins edit roles and status here.
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const result = useResult()

const saving = ref(false)

const form = reactive({
  name: '',
  email: '',
  role: 'teacher' as Role,
  status: 'active' as UserStatus,
  school: '',
  gradeLevels: [] as string[],
})

function openEdit(user: User) {
  editingId.value = user.id
  formError.value = ''
  Object.assign(form, {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    school: user.school,
    gradeLevels: [...user.gradeLevels],
  })
  dialogOpen.value = true
}

function toggleGrade(grade: string, checked: boolean) {
  if (checked) {
    if (!form.gradeLevels.includes(grade)) form.gradeLevels.push(grade)
  } else {
    form.gradeLevels = form.gradeLevels.filter((g) => g !== grade)
  }
}

async function submit() {
  if (!editingId.value) return
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = 'Name is required.'
    return
  }

  const original = users.byId(editingId.value)
  saving.value = true
  try {
    await users.update(editingId.value, {
      name: form.name.trim(),
      school: form.school.trim(),
      gradeLevels: form.role === 'admin' ? [] : [...form.gradeLevels],
    })
    if (original && form.role !== original.role) {
      await users.setRole(editingId.value, form.role)
    }
    if (original && form.status !== original.status) {
      await users.setStatus(editingId.value, form.status)
    }
    dialogOpen.value = false
    result.success('Account updated', `${form.name.trim()}'s changes were saved.`)
  } catch (e) {
    result.error('Could not save the account', e)
  } finally {
    saving.value = false
  }
}

async function setStatus(id: string, status: UserStatus) {
  try {
    await users.setStatus(id, status)
  } catch (e) {
    // The row keeps its previous status.
    result.error('Could not change the status', e)
  }
}

// --- Delete ----------------------------------------------------------------
const pendingDelete = ref<User | null>(null)

async function confirmDelete() {
  const target = pendingDelete.value
  pendingDelete.value = null
  if (!target) return
  try {
    await users.remove(target.id)
    result.success('Account deleted', `${target.name} was removed.`)
  } catch (e) {
    result.error('Could not delete the account', e)
  }
}

// --- Register teacher --------------------------------------------------------
const regForm = reactive({
  fullName: '',
  school: 'Agusan Pequeño Elementary School',
  email: '',
  password: '',
  gradeLevels: [] as string[],
})
const regErrors = reactive({ fullName: '', school: '', email: '', password: '' })
const regShowErrors = ref(false)
const regShowPassword = ref(false)
const regSaving = ref(false)
const regError = ref('')
// Kept after submit so the admin can still copy the password that was just set.
const createdAccount = ref<{ name: string; email: string; password: string } | null>(null)
const credentialsCopied = ref(false)

const strengthLabels = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors = [
  'bg-muted',
  'bg-destructive',
  'bg-(--brand-orange)',
  'bg-(--brand-gold)',
  'bg-primary',
]
const passwordScore = computed(() => {
  const pw = regForm.password
  if (!pw) return 0
  const checks = [
    pw.length >= PASSWORD_MIN,
    /[a-z]/i.test(pw) && /\d/.test(pw),
    pw.length >= 12,
    (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || /[^A-Za-z0-9]/.test(pw),
  ]
  return checks.filter(Boolean).length
})

const allGradesSelected = computed(() => regForm.gradeLevels.length === GRADE_LEVELS.length)
function toggleAllGrades() {
  regForm.gradeLevels = allGradesSelected.value ? [] : [...GRADE_LEVELS]
}

async function copyCredentials() {
  if (!createdAccount.value) return
  try {
    await navigator.clipboard.writeText(
      `Email: ${createdAccount.value.email}\nPassword: ${createdAccount.value.password}`,
    )
    credentialsCopied.value = true
    setTimeout(() => (credentialsCopied.value = false), 2000)
  } catch {
    // Clipboard can be blocked; the values are visible to copy by hand.
  }
}

watch(
  () => [regForm.fullName, regForm.school, regForm.email, regForm.password],
  () => {
    if (!regShowErrors.value) return
    regErrors.fullName = validateFullName(regForm.fullName)
    regErrors.school = validateSchool(regForm.school)
    regErrors.email = validateEmail(regForm.email)
    regErrors.password = validatePassword(regForm.password, true)
  },
)

function regToggleGrade(grade: string, checked: boolean) {
  if (checked) {
    if (!regForm.gradeLevels.includes(grade)) regForm.gradeLevels.push(grade)
  } else {
    regForm.gradeLevels = regForm.gradeLevels.filter((g) => g !== grade)
  }
}

function fillGeneratedPassword() {
  regForm.password = generatePassword()
  regShowPassword.value = true
  if (regShowErrors.value) regErrors.password = validatePassword(regForm.password, true)
}

async function submitRegistration() {
  regError.value = ''
  createdAccount.value = null
  regShowErrors.value = true
  regErrors.fullName = validateFullName(regForm.fullName)
  regErrors.school = validateSchool(regForm.school)
  regErrors.email = validateEmail(regForm.email)
  regErrors.password = validatePassword(regForm.password, true)
  if (regErrors.fullName || regErrors.school || regErrors.email || regErrors.password) return

  regSaving.value = true
  try {
    await users.registerTeacher({
      fullName: regForm.fullName.trim(),
      school: regForm.school.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
      gradeLevels: [...regForm.gradeLevels],
    })
    createdAccount.value = {
      name: regForm.fullName.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
    }
    regForm.fullName = ''
    regForm.email = ''
    regForm.password = ''
    regForm.gradeLevels = []
    regShowErrors.value = false
    regErrors.fullName = regErrors.school = regErrors.email = regErrors.password = ''
  } catch (e) {
    regError.value = e instanceof Error ? e.message : 'The account could not be created.'
  } finally {
    regSaving.value = false
  }
}
</script>

<template>
  <PageHeader
    title="User accounts"
    description="Set role-based access, manage teacher accounts, and register new teachers directly."
  />

  <Tabs v-model="tab">
    <TabsList>
      <TabsTrigger value="accounts">Accounts</TabsTrigger>
      <TabsTrigger value="register">Register teacher</TabsTrigger>
    </TabsList>

    <TabsContent value="accounts" class="space-y-4">
      <Card class="gap-0 py-0">
        <CardContent class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <Search
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input v-model="search" placeholder="Search by name, email or school" class="pl-9" />
          </div>
          <div class="flex gap-3">
            <Select v-model="roleFilter">
              <SelectTrigger class="w-[8.5rem]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[9rem]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-6">Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Grade levels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead class="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!filtered.length" :colspan="7">
                No account matches those filters.
              </TableEmpty>

              <TableRow v-for="user in filtered" :key="user.id">
                <TableCell class="pl-6">
                  <div class="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback class="bg-primary/10 text-primary">{{
                        initials(user.name)
                      }}</AvatarFallback>
                    </Avatar>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium">
                        {{ user.name }}
                        <span
                          v-if="user.id === auth.userId"
                          class="text-muted-foreground font-normal"
                          >(you)</span
                        >
                      </p>
                      <p class="text-muted-foreground truncate text-xs">{{ user.email }}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="user.role === 'admin' ? 'info' : 'secondary'" class="capitalize">
                    {{ user.role }}
                  </Badge>
                </TableCell>
                <TableCell class="max-w-56">
                  <span class="line-clamp-1 text-sm">{{ user.school || '—' }}</span>
                </TableCell>
                <TableCell>
                  <span class="text-muted-foreground text-xs">
                    {{ user.gradeLevels.length ? user.gradeLevels.join(', ') : '—' }}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge :variant="statusVariant[user.status]" class="capitalize">{{
                    user.status
                  }}</Badge>
                </TableCell>
                <TableCell class="text-muted-foreground whitespace-nowrap">
                  {{ formatDate(user.lastLogin) }}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal />
                        <span class="sr-only">Actions for {{ user.name }}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                      <DropdownMenuItem @select="openEdit(user)">
                        <Pencil />
                        Edit account
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-if="user.status !== 'active'"
                        @select="setStatus(user.id, 'active')"
                      >
                        <Check />
                        {{ user.status === 'pending' ? 'Approve' : 'Re-enable' }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-if="user.status === 'active' && user.id !== auth.userId"
                        @select="setStatus(user.id, 'disabled')"
                      >
                        <Ban />
                        Disable access
                      </DropdownMenuItem>
                      <template v-if="user.id !== auth.userId">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" @select="pendingDelete = user">
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <EmptyState
            v-if="!users.all.length"
            title="No accounts"
            description="Register the first teacher account to get started."
            :icon="Users"
          />
        </CardContent>
      </Card>
    </TabsContent>

    <TabsContent value="register">
      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Card>
          <CardContent class="space-y-8 p-6">
            <div class="space-y-1">
              <h3 class="text-base font-semibold">Register a teacher</h3>
              <p class="text-muted-foreground text-sm">
                Creates the account directly and sets it active. Share the sign-in details with the
                teacher so they can sign in and change the password.
              </p>
            </div>

            <!-- Shown after submit: the form clears, but the password stays copyable. -->
            <div
              v-if="createdAccount"
              class="border-primary/30 bg-primary/8 space-y-3 rounded-lg border p-4"
            >
              <div class="flex items-start gap-2">
                <Check class="text-primary mt-0.5 size-4 shrink-0" />
                <div class="space-y-0.5">
                  <p class="text-sm font-medium">Account created for {{ createdAccount.name }}</p>
                  <p class="text-muted-foreground text-xs">
                    Share these sign-in details. The password is not shown again once you close
                    this.
                  </p>
                </div>
              </div>
              <dl class="bg-background grid gap-1 rounded-md border px-3 py-2 text-sm">
                <div class="flex flex-wrap justify-between gap-x-4">
                  <dt class="text-muted-foreground">Email</dt>
                  <dd class="font-medium break-all">{{ createdAccount.email }}</dd>
                </div>
                <div class="flex flex-wrap justify-between gap-x-4">
                  <dt class="text-muted-foreground">Password</dt>
                  <dd class="font-mono font-medium break-all">{{ createdAccount.password }}</dd>
                </div>
              </dl>
              <div class="flex flex-wrap gap-2">
                <Button type="button" size="sm" @click="copyCredentials">
                  <Check v-if="credentialsCopied" />
                  <Copy v-else />
                  {{ credentialsCopied ? 'Copied' : 'Copy sign-in details' }}
                </Button>
                <Button type="button" size="sm" variant="ghost" @click="createdAccount = null">
                  Done
                </Button>
              </div>
            </div>

            <form class="space-y-8" novalidate @submit.prevent="submitRegistration">
              <fieldset class="space-y-4">
                <legend class="mb-4 text-sm font-semibold">Teacher details</legend>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="r-name">Full name</Label>
                    <Input
                      id="r-name"
                      v-model="regForm.fullName"
                      autocomplete="off"
                      :maxlength="NAME_MAX"
                      :aria-invalid="Boolean(regErrors.fullName) || undefined"
                      placeholder="Maria Santos"
                    />
                    <p v-if="regErrors.fullName" class="text-destructive text-xs">
                      {{ regErrors.fullName }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <Label for="r-school">School / office</Label>
                    <Input
                      id="r-school"
                      v-model="regForm.school"
                      :maxlength="SCHOOL_MAX"
                      :aria-invalid="Boolean(regErrors.school) || undefined"
                      placeholder="Agusan Pequeño Elementary School"
                    />
                    <p v-if="regErrors.school" class="text-destructive text-xs">
                      {{ regErrors.school }}
                    </p>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <Label>Grade levels handled</Label>
                    <button
                      type="button"
                      class="text-primary hover:text-primary/80 focus-visible:ring-ring/50 rounded text-xs font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                      @click="toggleAllGrades"
                    >
                      {{ allGradesSelected ? 'Clear all' : 'Select all' }}
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="grade in GRADE_LEVELS"
                      :key="grade"
                      type="button"
                      :aria-pressed="regForm.gradeLevels.includes(grade)"
                      class="focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-[background-color,border-color,color,transform] duration-200 outline-none focus-visible:ring-[3px] active:scale-95 motion-reduce:transition-none"
                      :class="
                        regForm.gradeLevels.includes(grade)
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent'
                      "
                      @click="regToggleGrade(grade, !regForm.gradeLevels.includes(grade))"
                    >
                      <Check
                        class="size-3.5 transition-[width,opacity] duration-200"
                        :class="
                          regForm.gradeLevels.includes(grade)
                            ? 'w-3.5 opacity-100'
                            : 'w-0 opacity-0'
                        "
                      />
                      {{ grade }}
                    </button>
                  </div>
                </div>
              </fieldset>

              <fieldset class="space-y-4 border-t pt-6">
                <legend class="sr-only">Sign-in details</legend>
                <p class="text-sm font-semibold">Sign-in details</p>

                <div class="space-y-2">
                  <Label for="r-email">Email</Label>
                  <Input
                    id="r-email"
                    v-model="regForm.email"
                    type="email"
                    inputmode="email"
                    autocomplete="off"
                    spellcheck="false"
                    :maxlength="EMAIL_MAX"
                    :aria-invalid="Boolean(regErrors.email) || undefined"
                    placeholder="name@school.com"
                  />
                  <p v-if="regErrors.email" class="text-destructive text-xs">
                    {{ regErrors.email }}
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="r-password">Temporary password</Label>
                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <Input
                        id="r-password"
                        v-model="regForm.password"
                        :type="regShowPassword ? 'text' : 'password'"
                        autocomplete="off"
                        :minlength="PASSWORD_MIN"
                        :maxlength="PASSWORD_MAX"
                        :aria-invalid="Boolean(regErrors.password) || undefined"
                        class="pr-10"
                        placeholder="At least 8 characters, with a number"
                      />
                      <button
                        type="button"
                        class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                        :aria-label="regShowPassword ? 'Hide password' : 'Show password'"
                        :aria-pressed="regShowPassword"
                        @click="regShowPassword = !regShowPassword"
                      >
                        <Eye v-if="regShowPassword" class="size-4" />
                        <EyeOff v-else class="size-4" />
                      </button>
                    </div>
                    <Button type="button" variant="outline" @click="fillGeneratedPassword">
                      <RefreshCw />
                      Generate
                    </Button>
                  </div>

                  <div class="flex items-center gap-3 pt-1" aria-live="polite">
                    <div class="grid flex-1 grid-cols-4 gap-1.5">
                      <span
                        v-for="n in 4"
                        :key="n"
                        class="h-1.5 rounded-full transition-colors duration-300"
                        :class="n <= passwordScore ? strengthColors[passwordScore] : 'bg-muted'"
                      />
                    </div>
                    <span class="text-muted-foreground w-28 text-right text-xs">
                      {{ strengthLabels[passwordScore] }}
                    </span>
                  </div>
                  <p v-if="regErrors.password" class="text-destructive text-xs">
                    {{ regErrors.password }}
                  </p>
                  <p v-else class="text-muted-foreground text-xs">
                    8–{{ PASSWORD_MAX }} characters, mixing letters and numbers.
                  </p>
                </div>
              </fieldset>

              <Alert v-if="regError" variant="destructive">
                <Ban />
                <AlertDescription>{{ regError }}</AlertDescription>
              </Alert>

              <Button type="submit" size="lg" class="w-full sm:w-auto" :disabled="regSaving">
                <Loader2 v-if="regSaving" class="animate-spin" />
                <UserPlus v-else />
                {{ regSaving ? 'Creating account…' : 'Register teacher' }}
              </Button>
            </form>
          </CardContent>
        </Card>

        <!-- Live preview of the account being created. -->
        <aside class="lg:sticky lg:top-24">
          <Card class="gap-0 py-0">
            <CardContent class="space-y-4 p-5">
              <p class="text-muted-foreground text-xs font-medium">Account preview</p>
              <div class="flex items-center gap-3">
                <Avatar class="size-12">
                  <AvatarFallback class="bg-primary/10 text-primary text-base">
                    {{ regForm.fullName.trim() ? initials(regForm.fullName) : '?' }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">
                    {{ regForm.fullName.trim() || 'Teacher name' }}
                  </p>
                  <p class="text-muted-foreground truncate text-xs">
                    {{ regForm.email.trim() || 'name@school.com' }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <Badge variant="secondary">Teacher</Badge>
                <Badge variant="success">Active on creation</Badge>
              </div>

              <dl class="space-y-3 border-t pt-4 text-sm">
                <div>
                  <dt class="text-muted-foreground text-xs">School</dt>
                  <dd class="font-medium">{{ regForm.school.trim() || '—' }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Grade levels</dt>
                  <dd class="font-medium">
                    {{
                      regForm.gradeLevels.length ? regForm.gradeLevels.join(', ') : 'None selected'
                    }}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </TabsContent>
  </Tabs>

  <!-- Edit dialog -->
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit account</DialogTitle>
        <DialogDescription>
          Teachers can generate and manage their own lesson plans. Admins manage curriculum data and
          accounts.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="u-name">Full name</Label>
            <Input id="u-name" v-model="form.name" placeholder="Maria Santos" />
          </div>
          <div class="space-y-2">
            <Label for="u-email">Email</Label>
            <Input id="u-email" v-model="form.email" type="email" disabled readonly />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="u-school">School / office</Label>
          <Input
            id="u-school"
            v-model="form.school"
            placeholder="Cebu City Central Elementary School"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="u-role">Role</Label>
            <Select v-model="form.role">
              <SelectTrigger id="u-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="u-status">Status</Label>
            <Select v-model="form.status">
              <SelectTrigger id="u-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending approval</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div v-if="form.role === 'teacher'" class="space-y-2">
          <Label>Grade levels handled</Label>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label
              v-for="grade in GRADE_LEVELS"
              :key="grade"
              class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
            >
              <Checkbox
                :model-value="form.gradeLevels.includes(grade)"
                @update:model-value="(v) => toggleGrade(grade, v === true)"
              />
              {{ grade }}
            </label>
          </div>
        </div>

        <p v-if="formError" class="text-destructive text-sm">{{ formError }}</p>

        <DialogFooter>
          <Button type="button" variant="outline" @click="dialogOpen = false">Cancel</Button>
          <Button type="submit" :disabled="saving">Save changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation -->
  <Dialog :open="pendingDelete !== null" @update:open="(v) => !v && (pendingDelete = null)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete this account?</DialogTitle>
        <DialogDescription>
          {{ pendingDelete?.name }} will lose access immediately. Their saved lesson plans are not
          deleted.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="pendingDelete = null">Cancel</Button>
        <Button variant="destructive" @click="confirmDelete">Delete account</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ResultDialog
    v-model:open="result.state.open"
    :kind="result.state.kind"
    :title="result.state.title"
    :description="result.state.description"
  />
</template>
