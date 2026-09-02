<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Ban, Check, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const users = useUsersStore()
const auth = useAuthStore()

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

// --- Create / edit ---------------------------------------------------------
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')

const form = reactive({
  name: '',
  email: '',
  role: 'teacher' as Role,
  status: 'active' as UserStatus,
  school: '',
  gradeLevels: [] as string[],
})

function openCreate() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, {
    name: '',
    email: '',
    role: 'teacher' as Role,
    status: 'active' as UserStatus,
    school: '',
    gradeLevels: [],
  })
  dialogOpen.value = true
}

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

function submit() {
  formError.value = ''
  if (!form.name.trim() || !form.email.trim()) {
    formError.value = 'Name and email are required.'
    return
  }
  const clash = users.all.find(
    (u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== editingId.value,
  )
  if (clash) {
    formError.value = 'Another account already uses that email address.'
    return
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    role: form.role,
    status: form.status,
    school: form.school.trim(),
    gradeLevels: form.role === 'admin' ? [] : [...form.gradeLevels],
  }

  if (editingId.value) users.update(editingId.value, payload)
  else users.create(payload)

  dialogOpen.value = false
}

// --- Delete ----------------------------------------------------------------
const pendingDelete = ref<User | null>(null)

function confirmDelete() {
  if (pendingDelete.value) users.remove(pendingDelete.value.id)
  pendingDelete.value = null
}
</script>

<template>
  <PageHeader
    title="User accounts"
    description="Register teachers, approve pending sign-ups and set role-based access."
  >
    <template #actions>
      <Button @click="openCreate">
        <Plus />
        Add account
      </Button>
    </template>
  </PageHeader>

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
                    <span v-if="user.id === auth.userId" class="text-muted-foreground font-normal"
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
                    @select="users.setStatus(user.id, 'active')"
                  >
                    <Check />
                    {{ user.status === 'pending' ? 'Approve' : 'Re-enable' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="user.status === 'active' && user.id !== auth.userId"
                    @select="users.setStatus(user.id, 'disabled')"
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
        description="Add the first teacher account to get started."
        :icon="Users"
      />
    </CardContent>
  </Card>

  <!-- Create / edit dialog -->
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ editingId ? 'Edit account' : 'Add account' }}</DialogTitle>
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
            <Input
              id="u-email"
              v-model="form.email"
              type="email"
              placeholder="name@lessonplan.ph"
            />
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
          <Button type="submit">{{ editingId ? 'Save changes' : 'Create account' }}</Button>
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
