<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  FileText,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
} from 'lucide-vue-next'
import EmptyState from '@/components/app/EmptyState.vue'
import LessonPlanDocument from '@/components/app/LessonPlanDocument.vue'
import PlanEditor from '@/components/app/PlanEditor.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { LessonPlan, PlanStatus } from '@/types'
import { usePlansStore } from '@/stores/plans'
import { useCatalogStore } from '@/stores/catalog'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime, romanQuarter } from '@/lib/format'
import { planToText } from '@/lib/export'
import { downloadElementAsPdf } from '@/lib/pdf'

const route = useRoute()
const plans = usePlansStore()
const catalog = useCatalogStore()
const auth = useAuthStore()

const planId = computed(() => String(route.params.id))
const plan = computed<LessonPlan | null>(() => plans.byId(planId.value))
const competency = computed(() =>
  plan.value ? catalog.competencyById(plan.value.competencyId) : null,
)

const editing = ref(false)
const savedAt = ref<string | null>(null)
const confirmRegenerate = ref(false)
const documentEl = ref<InstanceType<typeof LessonPlanDocument> | null>(null)
const exportingPdf = ref(false)

// Regenerating or navigating replaces the plan, so drop any open editor.
watch(planId, () => {
  editing.value = false
  savedAt.value = null
})

const totalMinutes = computed(
  () => plan.value?.sections.reduce((sum, s) => sum + s.minutes, 0) ?? 0,
)
const minutesOff = computed(() => (plan.value ? totalMinutes.value - plan.value.duration : 0))

async function applyEdits(patch: Partial<LessonPlan>) {
  if (!plan.value) return
  await plans.update(plan.value.id, patch)
  savedAt.value = new Date().toISOString()
  editing.value = false
}

async function setStatus(status: PlanStatus) {
  if (!plan.value) return
  await plans.update(plan.value.id, { status })
  savedAt.value = new Date().toISOString()
}

async function regenerate() {
  confirmRegenerate.value = false
  if (!plan.value) return
  editing.value = false
  await plans.regenerate(plan.value.id)
  savedAt.value = new Date().toISOString()
}

function printPlan() {
  window.print()
}

async function downloadPdf() {
  const current = plan.value
  const el = documentEl.value?.$el as HTMLElement | undefined
  if (!current || !el) return
  const name = current.title
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  exportingPdf.value = true
  try {
    await downloadElementAsPdf(el, `${name}.pdf`)
  } finally {
    exportingPdf.value = false
  }
}

function download(kind: 'txt' | 'md' | 'json') {
  const current = plan.value
  if (!current) return
  const name = current.title
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  const content =
    kind === 'json' ? JSON.stringify(current, null, 2) : planToText(current, competency.value, kind)
  const blob = new Blob([content], {
    type: kind === 'json' ? 'application/json' : 'text/plain;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.${kind}`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-if="!plan && plans.loading" class="text-muted-foreground py-16 text-center text-sm">
    Loading lesson plan…
  </div>

  <EmptyState
    v-else-if="!plan"
    title="Lesson plan not found"
    description="It may have been deleted, or it belongs to another teacher."
    :icon="FileText"
  >
    <Button as-child size="sm">
      <RouterLink to="/teacher/plans">Back to my lesson plans</RouterLink>
    </Button>
  </EmptyState>

  <template v-else>
    <div class="space-y-4 no-print">
      <Button variant="ghost" size="sm" class="-ml-2" as-child>
        <RouterLink to="/teacher/plans">
          <ArrowLeft />
          My lesson plans
        </RouterLink>
      </Button>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">{{ plan.title }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <Badge :variant="plan.status === 'final' ? 'success' : 'secondary'" class="capitalize">
              {{ plan.status }}
            </Badge>
            <Badge variant="outline" class="font-mono text-[11px]">{{ plan.competencyCode }}</Badge>
            <span class="text-muted-foreground text-sm">
              {{ plan.grade }} · Quarter {{ romanQuarter(plan.quarter) }} ·
              {{ plan.duration }} minutes ·
              {{ plan.templateName }}
            </span>
          </div>
          <p class="text-muted-foreground text-xs">
            Updated {{ formatDateTime(plan.updatedAt) }} · generated {{ plan.generationCount }}
            {{ plan.generationCount === 1 ? 'time' : 'times' }}
          </p>
        </div>

        <div v-if="!editing" class="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" :disabled="plans.generating" @click="confirmRegenerate = true">
            <Loader2 v-if="plans.generating" class="animate-spin" />
            <RefreshCw v-else />
            Regenerate
          </Button>
          <Button variant="outline" @click="editing = true">
            <Pencil />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline">
                <Download />
                Save / Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-52">
              <DropdownMenuItem :disabled="exportingPdf" @select="downloadPdf">
                <Loader2 v-if="exportingPdf" class="animate-spin" />
                <Download v-else />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem @select="printPlan">
                <Printer />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem @select="download('txt')">
                <FileText />
                Plain text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem @select="download('md')">
                <FileText />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem @select="download('json')">
                <FileText />
                Data file (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button v-if="plan.status === 'draft'" @click="setStatus('final')">
            <Check />
            Mark as final
          </Button>
          <Button v-else variant="secondary" @click="setStatus('draft')">Reopen as draft</Button>
        </div>
      </div>

      <Alert v-if="savedAt && !editing" variant="success">
        <Check />
        <AlertDescription>Saved {{ formatDateTime(savedAt) }}.</AlertDescription>
      </Alert>

      <Alert v-if="minutesOff !== 0 && !editing" variant="info">
        <Clock />
        <AlertDescription>
          The sections add up to {{ totalMinutes }} minutes, which is {{ Math.abs(minutesOff) }}
          {{ minutesOff > 0 ? 'over' : 'under' }} the {{ plan.duration }}-minute period. Adjust the
          section timings when you edit.
        </AlertDescription>
      </Alert>
    </div>

    <!-- Editor -->
    <PlanEditor
      v-if="editing"
      :key="plan.id + plan.updatedAt"
      :plan="plan"
      class="no-print"
      @save="applyEdits"
      @cancel="editing = false"
    />

    <!-- Reader -->
    <div v-else class="no-print grid gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <Card class="print-plain">
          <CardHeader>
            <CardTitle class="text-base">I. Objectives</CardTitle>
            <CardDescription
              >At the end of the lesson, the learners should be able to:</CardDescription
            >
          </CardHeader>
          <CardContent>
            <ol class="marker:text-muted-foreground list-decimal space-y-2 pl-5 text-sm">
              <li
                v-for="(objective, index) in plan.objectives"
                :key="index"
                class="leading-relaxed"
              >
                {{ objective }}
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card class="print-plain">
          <CardHeader>
            <CardTitle class="text-base">II. Procedure</CardTitle>
            <CardDescription>{{ plan.templateName }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <div
              v-for="(section, index) in plan.sections"
              :key="section.key"
              class="border-l-2 pl-4"
              :class="index === 0 ? 'border-primary' : 'border-border'"
            >
              <div class="mb-1.5 flex items-baseline justify-between gap-3">
                <h3 class="font-medium">{{ section.title }}</h3>
                <span class="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                  <Clock class="size-3" />
                  {{ section.minutes }} min
                </span>
              </div>
              <p class="text-sm leading-relaxed">{{ section.body }}</p>
            </div>
          </CardContent>
        </Card>

        <Card class="print-plain">
          <CardHeader>
            <CardTitle class="text-base">III. Evaluation and assignment</CardTitle>
          </CardHeader>
          <CardContent class="space-y-5 text-sm">
            <div class="space-y-1.5">
              <p class="text-muted-foreground text-xs tracking-wide uppercase">Assessment</p>
              <p class="leading-relaxed">{{ plan.assessment }}</p>
            </div>
            <Separator />
            <div class="space-y-1.5">
              <p class="text-muted-foreground text-xs tracking-wide uppercase">Assignment</p>
              <p class="leading-relaxed">{{ plan.assignment }}</p>
            </div>
            <Separator />
            <div class="space-y-1.5">
              <p class="text-muted-foreground text-xs tracking-wide uppercase">Remarks</p>
              <p class="leading-relaxed" :class="!plan.remarks && 'text-muted-foreground'">
                {{ plan.remarks || 'No remarks.' }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="space-y-6">
        <Card v-if="competency" class="print-plain">
          <CardHeader>
            <CardTitle class="text-base">Competency</CardTitle>
            <CardDescription>{{ competency.domain }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Badge variant="outline" class="font-mono text-[11px]">{{ competency.code }}</Badge>
            <p class="text-sm leading-relaxed">{{ competency.description }}</p>
          </CardContent>
        </Card>

        <Card class="print-plain">
          <CardHeader>
            <CardTitle class="text-base">Learning resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul class="space-y-2 text-sm">
              <li v-for="item in plan.materials" :key="item" class="flex items-start gap-2">
                <span class="bg-primary/60 mt-1.5 size-1.5 shrink-0 rounded-full" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card class="no-print">
          <CardHeader>
            <CardTitle class="text-base">Time allocation</CardTitle>
            <CardDescription
              >{{ totalMinutes }} of {{ plan.duration }} minutes assigned</CardDescription
            >
          </CardHeader>
          <CardContent class="space-y-2.5">
            <div v-for="section in plan.sections" :key="section.key" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="truncate">{{ section.title }}</span>
                <span class="text-muted-foreground tabular-nums">{{ section.minutes }}m</span>
              </div>
              <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  class="bg-primary h-full rounded-full"
                  :style="{
                    width: `${Math.min(100, (section.minutes / Math.max(1, plan.duration)) * 100)}%`,
                  }"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Print / PDF document: off-screen until an actual print or PDF export. -->
    <div class="print-doc">
      <LessonPlanDocument
        ref="documentEl"
        :plan="plan"
        :competency="competency"
        :teacher-name="auth.currentUser?.name ?? ''"
        :school="auth.currentUser?.school ?? ''"
      />
    </div>

    <Dialog v-model:open="confirmRegenerate">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate this lesson plan?</DialogTitle>
          <DialogDescription>
            A fresh draft is written from the same topic, competency and template. Your current
            objectives, procedure and assessment will be replaced.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmRegenerate = false">Keep current version</Button>
          <Button @click="regenerate">
            <RefreshCw />
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </template>
</template>
