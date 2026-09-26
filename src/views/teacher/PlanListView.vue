<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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
import type { LessonPlan } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/plans'
import { formatDate, romanQuarter } from '@/lib/format'

const auth = useAuthStore()
const plans = usePlansStore()
const router = useRouter()

const search = ref('')
const status = ref('all')

const mine = computed(() => (auth.currentUser ? plans.forOwner(auth.currentUser.id) : []))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return mine.value.filter((plan) => {
    if (status.value !== 'all' && plan.status !== status.value) return false
    if (!q) return true
    return (
      plan.title.toLowerCase().includes(q) ||
      plan.topic.toLowerCase().includes(q) ||
      plan.competencyCode.toLowerCase().includes(q)
    )
  })
})

// --- Delete flow: confirm → deleting → deleted | failed -----------------------
// The plan stays in `pendingDelete` while the dialog closes, so its title doesn't
// blank out mid-animation; `deleteOpen` alone drives visibility.
type DeleteState = 'confirm' | 'deleting' | 'deleted' | 'failed'

const pendingDelete = ref<LessonPlan | null>(null)
const deleteOpen = ref(false)
const deleteState = ref<DeleteState>('confirm')
const deleteError = ref('')

function askDelete(plan: LessonPlan) {
  pendingDelete.value = plan
  deleteState.value = 'confirm'
  deleteError.value = ''
  deleteOpen.value = true
}

function onDeleteOpenChange(open: boolean) {
  // A delete in flight can't be dismissed halfway through.
  if (!open && deleteState.value === 'deleting') return
  deleteOpen.value = open
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleteState.value = 'deleting'
  deleteError.value = ''
  try {
    await plans.remove(pendingDelete.value.id)
    deleteState.value = 'deleted'
    setTimeout(() => {
      if (deleteState.value === 'deleted') deleteOpen.value = false
    }, 1200)
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
    deleteState.value = 'failed'
  }
}

const deleteProgress = computed(
  () => ({ confirm: 0, deleting: 65, deleted: 100, failed: 100 })[deleteState.value],
)

async function duplicate(id: string) {
  const copy = await plans.duplicate(id)
  if (copy) router.push(`/teacher/plans/${copy.id}`)
}
</script>

<template>
  <PageHeader
    title="My lesson plans"
    description="Every plan you have generated, saved or finalised."
  >
    <template #actions>
      <Button as-child>
        <RouterLink to="/teacher/generate">
          <Sparkles />
          New lesson plan
        </RouterLink>
      </Button>
    </template>
  </PageHeader>

  <Card class="gap-0 py-0">
    <CardContent class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input v-model="search" placeholder="Search by title, topic or MELC code" class="pl-9" />
      </div>

      <div class="flex gap-3">
        <Select v-model="status">
          <SelectTrigger class="w-[8.5rem]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="final">Final</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>

    <CardContent class="p-0">
      <EmptyState
        v-if="!mine.length"
        title="No lesson plans yet"
        description="Generate your first plan from a competency and it will appear here."
        :icon="FileText"
      >
        <Button as-child size="sm">
          <RouterLink to="/teacher/generate">Generate a plan</RouterLink>
        </Button>
      </EmptyState>

      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="pl-6">Lesson</TableHead>
            <TableHead>MELC</TableHead>
            <TableHead>Grade / Quarter</TableHead>
            <TableHead class="text-right">Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead class="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="!filtered.length" :colspan="7">
            No lesson plan matches those filters.
          </TableEmpty>

          <TableRow v-for="plan in filtered" :key="plan.id">
            <TableCell class="pl-6">
              <RouterLink
                :to="`/teacher/plans/${plan.id}`"
                class="block max-w-[22rem] hover:underline"
              >
                <span class="line-clamp-1 font-medium">{{ plan.title }}</span>
                <span class="text-muted-foreground line-clamp-1 text-xs">{{
                  plan.templateName
                }}</span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <Badge variant="outline" class="font-mono text-[11px]">{{
                plan.competencyCode
              }}</Badge>
            </TableCell>
            <TableCell class="whitespace-nowrap">
              {{ plan.grade }} · Q{{ romanQuarter(plan.quarter) }}
            </TableCell>
            <TableCell class="text-right tabular-nums">{{ plan.duration }} min</TableCell>
            <TableCell>
              <Badge
                :variant="plan.status === 'final' ? 'success' : 'secondary'"
                class="capitalize"
              >
                {{ plan.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground whitespace-nowrap">
              {{ formatDate(plan.updatedAt) }}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal />
                    <span class="sr-only">Actions for {{ plan.title }}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuItem @select="router.push(`/teacher/plans/${plan.id}`)">
                    <Eye />
                    View / edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @select="duplicate(plan.id)">
                    <Copy />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" @select="askDelete(plan)">
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

  <Dialog :open="deleteOpen" @update:open="onDeleteOpenChange">
    <DialogContent class="sm:max-w-md" :show-close-button="deleteState !== 'deleting'">
      <!-- Confirm -->
      <template v-if="deleteState === 'confirm'">
        <DialogHeader>
          <DialogTitle>Delete this lesson plan?</DialogTitle>
          <DialogDescription>
            “{{ pendingDelete?.title }}” will be removed permanently. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">
            <Trash2 />
            Delete plan
          </Button>
        </DialogFooter>
      </template>

      <!-- Deleting / deleted / failed -->
      <template v-else>
        <div class="flex flex-col items-center gap-4 pt-2 text-center" aria-live="polite">
          <div
            class="flex size-12 items-center justify-center rounded-full"
            :class="{
              'bg-destructive/10 text-destructive': deleteState !== 'deleted',
              'bg-(--brand-green)/15 text-(--brand-green)': deleteState === 'deleted',
            }"
          >
            <Loader2 v-if="deleteState === 'deleting'" class="size-6 animate-spin" />
            <CheckCircle2 v-else-if="deleteState === 'deleted'" class="size-6" />
            <XCircle v-else class="size-6" />
          </div>

          <DialogHeader class="items-center text-center sm:text-center">
            <DialogTitle>
              {{
                deleteState === 'deleting'
                  ? 'Deleting lesson plan…'
                  : deleteState === 'deleted'
                    ? 'Lesson plan deleted'
                    : 'Failed to delete'
              }}
            </DialogTitle>
            <DialogDescription>
              <template v-if="deleteState === 'failed'">{{ deleteError }}</template>
              <template v-else>“{{ pendingDelete?.title }}”</template>
            </DialogDescription>
          </DialogHeader>

          <Progress
            :model-value="deleteProgress"
            class="h-1.5"
            :indicator-class="{
              'duration-700': true,
              'bg-(--brand-green)': deleteState === 'deleted',
              'bg-destructive': deleteState !== 'deleted',
            }"
          />
        </div>

        <DialogFooter v-if="deleteState === 'failed'">
          <Button variant="outline" @click="deleteOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Try again</Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
