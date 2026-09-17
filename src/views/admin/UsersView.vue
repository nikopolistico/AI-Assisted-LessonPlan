<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Ban,
  Check,
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
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Could not save the account.'
  } finally {
    saving.value = false
  }
}

async function setStatus(id: string, status: UserStatus) {
  try {
    await users.setStatus(id, status)
  } catch {
    // no-op — the row keeps its previous status
  }
}

// --- Delete ----------------------------------------------------------------
const pendingDelete = ref<User | null>(null)

async function confirmDelete() {
  if (pendingDelete.value) await users.remove(pendingDelete.value.id)
  pendingDelete.value = null
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
const regNotice = ref('')

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
  regNotice.value = ''
  regError.value = ''
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
    regNotice.value = `${regForm.fullName.trim()}'s account was created and is ready to sign in with the password above.`
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
      <Card class="mx-auto max-w-2xl">
        <CardContent class="space-y-6 p-6">
          <div class="space-y-1">
            <h3 class="text-base font-semibold">Register a teacher</h3>
            <p class="text-muted-foreground text-sm">
              Creates the account directly and sets it active. Share the password below with the
              teacher so they can sign in and change it.
            </p>
          </div>

          <Alert v-if="regNotice" variant="success">
            <Check />
            <AlertDescription>{{ regNotice }}</AlertDescription>
          </Alert>

          <form class="space-y-4" novalidate @submit.prevent="submitRegistration">
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
              <p v-if="regErrors.email" class="text-destructive text-xs">{{ regErrors.email }}</p>
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
                    class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    :aria-label="regShowPassword ? 'Hide password' : 'Show password'"
                    :aria-pressed="regShowPassword"
                    @click="regShowPassword = !regShowPassword"
                  >
                    <EyeOff v-if="regShowPassword" class="size-4" />
                    <Eye v-else class="size-4" />
                  </button>
                </div>
                <Button type="button" variant="outline" @click="fillGeneratedPassword">
                  <RefreshCw />
                  Generate
                </Button>
              </div>
              <p v-if="regErrors.password" class="text-destructive text-xs">
                {{ regErrors.password }}
              </p>
              <p v-else class="text-muted-foreground text-xs">
                8–{{ PASSWORD_MAX }} characters, mixing letters and numbers.
              </p>
            </div>

            <div class="space-y-2">
              <Label>Grade levels handled</Label>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <label
                  v-for="grade in GRADE_LEVELS"
                  :key="grade"
                  class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
                >
                  <Checkbox
                    :model-value="regForm.gradeLevels.includes(grade)"
                    @update:model-value="(v) => regToggleGrade(grade, v === true)"
                  />
                  {{ grade }}
                </label>
              </div>
            </div>

            <Alert v-if="regError" variant="destructive">
              <Ban />
              <AlertDescription>{{ regError }}</AlertDescription>
            </Alert>

            <Button type="submit" :disabled="regSaving">
              <Loader2 v-if="regSaving" class="animate-spin" />
              <UserPlus v-else />
              {{ regSaving ? 'Creating account…' : 'Register teacher' }}
            </Button>
          </form>
        </CardContent>
      </Card>
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
</template>
