<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { BookOpen, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
import type { Competency } from '@/types'
import { useCatalogStore } from '@/stores/catalog'
import { usePlansStore } from '@/stores/plans'

const catalog = useCatalogStore()
const plans = usePlansStore()

const search = ref('')
const gradeFilter = ref('all')
const quarterFilter = ref('all')
const domainFilter = ref('all')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return catalog.competencies.filter((item) => {
    if (gradeFilter.value !== 'all' && item.grade !== gradeFilter.value) return false
    if (quarterFilter.value !== 'all' && String(item.quarter) !== quarterFilter.value) return false
    if (domainFilter.value !== 'all' && item.domain !== domainFilter.value) return false
    if (!q) return true
    return item.code.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  })
})

/** How many saved plans reference each competency — shown before deletion. */
function planCount(id: string) {
  return plans.all.filter((p) => p.competencyId === id).length
}

const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')

const form = reactive({
  code: '',
  grade: 'Grade 3',
  quarter: '1',
  domain: 'Numbers and Number Sense',
  description: '',
  active: true,
})

const domainChoices = computed(() => {
  const known = [
    'Numbers and Number Sense',
    'Patterns and Algebra',
    'Geometry',
    'Measurement',
    'Statistics and Probability',
  ]
  return [...new Set([...known, ...catalog.domains])]
})

function openCreate() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, {
    code: '',
    grade: 'Grade 3',
    quarter: '1',
    domain: 'Numbers and Number Sense',
    description: '',
    active: true,
  })
  dialogOpen.value = true
}

function openEdit(item: Competency) {
  editingId.value = item.id
  formError.value = ''
  Object.assign(form, {
    code: item.code,
    grade: item.grade,
    quarter: String(item.quarter),
    domain: item.domain,
    description: item.description,
    active: item.active,
  })
  dialogOpen.value = true
}

function submit() {
  formError.value = ''
  if (!form.code.trim() || !form.description.trim()) {
    formError.value = 'A MELC code and description are required.'
    return
  }
  const clash = catalog.competencies.find(
    (c) => c.code.toLowerCase() === form.code.trim().toLowerCase() && c.id !== editingId.value,
  )
  if (clash) {
    formError.value = `${clash.code} is already encoded.`
    return
  }

  const payload = {
    code: form.code.trim(),
    grade: form.grade,
    quarter: Number(form.quarter) as 1 | 2 | 3 | 4,
    domain: form.domain,
    description: form.description.trim(),
    active: form.active,
  }

  if (editingId.value) catalog.updateCompetency(editingId.value, payload)
  else catalog.addCompetency(payload)

  dialogOpen.value = false
}

const pendingDelete = ref<Competency | null>(null)

function confirmDelete() {
  if (pendingDelete.value) catalog.removeCompetency(pendingDelete.value.id)
  pendingDelete.value = null
}
</script>

<template>
  <PageHeader
    title="Math competencies"
    description="The MELC list teachers choose from when generating a plan. Inactive entries stay in the records but are hidden from the picker."
  >
    <template #actions>
      <Button @click="openCreate">
        <Plus />
        Add competency
      </Button>
    </template>
  </PageHeader>

  <Card class="gap-0 py-0">
    <CardContent class="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
      <div class="relative">
        <Search
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input v-model="search" placeholder="Search by code or description" class="pl-9" />
      </div>

      <Select v-model="gradeFilter">
        <SelectTrigger class="lg:w-[9.5rem]">
          <SelectValue placeholder="Grade level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All grade levels</SelectItem>
          <SelectItem v-for="g in GRADE_LEVELS" :key="g" :value="g">{{ g }}</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="quarterFilter">
        <SelectTrigger class="lg:w-[8.5rem]">
          <SelectValue placeholder="Quarter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All quarters</SelectItem>
          <SelectItem v-for="q in [1, 2, 3, 4]" :key="q" :value="String(q)"
            >Quarter {{ q }}</SelectItem
          >
        </SelectContent>
      </Select>

      <Select v-model="domainFilter">
        <SelectTrigger class="lg:w-[13rem]">
          <SelectValue placeholder="Domain" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All domains</SelectItem>
          <SelectItem v-for="domain in catalog.domains" :key="domain" :value="domain">{{
            domain
          }}</SelectItem>
        </SelectContent>
      </Select>
    </CardContent>

    <CardContent class="p-0">
      <EmptyState
        v-if="!catalog.competencies.length"
        title="No competencies encoded"
        description="Add the MELCs for each grade level so teachers can select them."
        :icon="BookOpen"
      >
        <Button size="sm" @click="openCreate">Add the first competency</Button>
      </EmptyState>

      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="pl-6">Code</TableHead>
            <TableHead>Grade / Quarter</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Description</TableHead>
            <TableHead class="text-right">Plans</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="!filtered.length" :colspan="7">
            No competency matches those filters.
          </TableEmpty>

          <TableRow v-for="item in filtered" :key="item.id" :class="!item.active && 'opacity-60'">
            <TableCell class="pl-6">
              <Badge variant="outline" class="font-mono text-[11px]">{{ item.code }}</Badge>
            </TableCell>
            <TableCell class="whitespace-nowrap">{{ item.grade }} · Q{{ item.quarter }}</TableCell>
            <TableCell class="text-muted-foreground text-xs">{{ item.domain }}</TableCell>
            <TableCell class="max-w-md">
              <span class="line-clamp-2 text-sm">{{ item.description }}</span>
            </TableCell>
            <TableCell class="text-right tabular-nums">{{ planCount(item.id) }}</TableCell>
            <TableCell>
              <Badge :variant="item.active ? 'success' : 'outline'">
                {{ item.active ? 'Active' : 'Inactive' }}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal />
                    <span class="sr-only">Actions for {{ item.code }}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem @select="openEdit(item)">
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    @select="catalog.updateCompetency(item.id, { active: !item.active })"
                  >
                    {{ item.active ? 'Set inactive' : 'Set active' }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" @select="pendingDelete = item">
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ editingId ? 'Edit competency' : 'Add competency' }}</DialogTitle>
        <DialogDescription>
          Use the official MELC code so plans stay traceable to the curriculum guide.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="c-code">MELC code</Label>
            <Input id="c-code" v-model="form.code" placeholder="M5NS-Ia-1" class="font-mono" />
          </div>
          <div class="space-y-2">
            <Label for="c-domain">Domain</Label>
            <Select v-model="form.domain">
              <SelectTrigger id="c-domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="domain in domainChoices" :key="domain" :value="domain">
                  {{ domain }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="c-grade">Grade level</Label>
            <Select v-model="form.grade">
              <SelectTrigger id="c-grade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="g in GRADE_LEVELS" :key="g" :value="g">{{ g }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="c-quarter">Quarter</Label>
            <Select v-model="form.quarter">
              <SelectTrigger id="c-quarter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="q in [1, 2, 3, 4]" :key="q" :value="String(q)"
                  >Quarter {{ q }}</SelectItem
                >
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="c-description">Description</Label>
          <Textarea
            id="c-description"
            v-model="form.description"
            rows="3"
            placeholder="Visualizes numbers up to 10 000 000…"
          />
        </div>

        <label class="flex items-center justify-between rounded-lg border p-3">
          <span class="space-y-0.5">
            <span class="block text-sm font-medium">Available to teachers</span>
            <span class="text-muted-foreground block text-xs">
              Inactive competencies stay recorded but disappear from the generator.
            </span>
          </span>
          <Switch v-model="form.active" />
        </label>

        <p v-if="formError" class="text-destructive text-sm">{{ formError }}</p>

        <DialogFooter>
          <Button type="button" variant="outline" @click="dialogOpen = false">Cancel</Button>
          <Button type="submit">{{ editingId ? 'Save changes' : 'Add competency' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <Dialog :open="pendingDelete !== null" @update:open="(v) => !v && (pendingDelete = null)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete {{ pendingDelete?.code }}?</DialogTitle>
        <DialogDescription>
          <template v-if="pendingDelete && planCount(pendingDelete.id)">
            {{ planCount(pendingDelete.id) }} saved lesson
            {{ planCount(pendingDelete.id) === 1 ? 'plan references' : 'plans reference' }} this
            competency. Those plans keep their MELC code but lose the linked description. Setting it
            inactive is usually the safer choice.
          </template>
          <template v-else> This competency is not used by any saved lesson plan. </template>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="pendingDelete = null">Cancel</Button>
        <Button variant="destructive" @click="confirmDelete">Delete competency</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
