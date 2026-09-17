<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, Clock, Loader2, Sparkles, Terminal } from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DURATIONS } from '@/data/seed'
import type { LessonRequest } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'
import { usePlansStore } from '@/stores/plans'
import { generatorModel } from '@/lib/openai'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()
const plans = usePlansStore()

const form = reactive<LessonRequest>({
  topic: '',
  competencyId: '',
  grade: 'Grade 3',
  quarter: 1,
  duration: 60,
  templateId: catalog.defaultTemplate?.id ?? '',
  learners: '',
  notes: '',
})

const error = ref('')

/** MELCs narrow to the chosen grade and quarter so the picker stays short. */
const competencyOptions = computed(() => catalog.competenciesFor(form.grade, form.quarter))
const selectedCompetency = computed(() => catalog.competencyById(form.competencyId))
const selectedTemplate = computed(() => catalog.templateById(form.templateId))

const sectionMinutes = computed(() => {
  const count = selectedTemplate.value?.sections.length ?? 0
  return count ? Math.round(form.duration / count) : 0
})

// Clear a competency that no longer belongs to the selected grade or quarter.
watch([() => form.grade, () => form.quarter], () => {
  if (!competencyOptions.value.some((c) => c.id === form.competencyId)) form.competencyId = ''
})

// Prefill the topic from the competency the teacher picked, while it is untouched.
const topicTouched = ref(false)
watch(selectedCompetency, (competency) => {
  if (competency && !topicTouched.value) {
    form.topic = competency.description.replace(/\.$/, '')
  }
})

// Reference data loads asynchronously from Supabase, so preselect the default
// template and apply any ?competency= preset once the catalogue has arrived.
watch(
  () => catalog.defaultTemplate?.id,
  (id) => {
    if (id && !form.templateId) form.templateId = id
  },
  { immediate: true },
)

watch(
  () => catalog.competencies.length,
  () => {
    const preset = typeof route.query.competency === 'string' ? route.query.competency : null
    const competency = preset ? catalog.competencyById(preset) : null
    if (competency && form.competencyId !== competency.id) {
      form.grade = competency.grade
      form.quarter = competency.quarter
      form.competencyId = competency.id
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (!catalog.competencies.length) void catalog.fetchAll()
})

const canGenerate = computed(() =>
  Boolean(form.competencyId && form.templateId && form.topic.trim() && !plans.generating),
)

// --- Typewriter view of the model's streamed output --------------------------
const streamFull = ref('') // everything received from the model so far
const streamShown = ref('') // the slice the typewriter has revealed
const streamBox = ref<HTMLElement | null>(null)
let typeTimer: number | undefined

function stopTypewriter() {
  if (typeTimer !== undefined) {
    clearInterval(typeTimer)
    typeTimer = undefined
  }
}

function startTypewriter() {
  stopTypewriter()
  streamFull.value = ''
  streamShown.value = ''
  typeTimer = window.setInterval(() => {
    if (streamShown.value.length >= streamFull.value.length) return
    // Reveal faster when the model is far ahead, so it never lags too far behind.
    const behind = streamFull.value.length - streamShown.value.length
    const step = Math.max(2, Math.ceil(behind / 40))
    streamShown.value = streamFull.value.slice(0, streamShown.value.length + step)
    void nextTick(() => {
      if (streamBox.value) streamBox.value.scrollTop = streamBox.value.scrollHeight
    })
  }, 16)
}

onBeforeUnmount(stopTypewriter)

async function submit() {
  error.value = ''
  if (!auth.currentUser) return
  if (!form.competencyId) {
    error.value = 'Choose the MELC this lesson addresses.'
    return
  }
  if (!form.templateId) {
    error.value = 'Choose a lesson template.'
    return
  }
  startTypewriter()
  try {
    const plan = await plans.generate({ ...form }, auth.currentUser.id, (full) => {
      streamFull.value = full
    })
    streamShown.value = streamFull.value // show the tail before we leave
    router.push(`/teacher/plans/${plan.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Generation failed. Try again.'
  } finally {
    stopTypewriter()
  }
}
</script>

<template>
  <PageHeader
    title="Generate a lesson plan"
    description="Fill in the lesson details. The draft follows your division's template and stays fully editable."
  />

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Input form -->
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle>Lesson details</CardTitle>
        <CardDescription>Topic, competency, grade level and time duration.</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-6" @submit.prevent="submit">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="grade">Grade level</Label>
              <div
                id="grade"
                class="border-input bg-muted/40 text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm"
              >
                {{ form.grade }}
              </div>
            </div>

            <div class="space-y-2">
              <Label for="quarter">Quarter</Label>
              <Select
                :model-value="String(form.quarter)"
                @update:model-value="(v) => (form.quarter = Number(v) as 1 | 2 | 3 | 4)"
              >
                <SelectTrigger id="quarter">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="q in [1, 2, 3, 4]" :key="q" :value="String(q)">
                    Quarter {{ q }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="competency">Most Essential Learning Competency (MELC)</Label>
            <Select v-model="form.competencyId">
              <SelectTrigger id="competency" class="h-auto min-h-9 py-2">
                <SelectValue placeholder="Select a competency for this grade and quarter" />
              </SelectTrigger>
              <SelectContent class="max-w-[min(36rem,90vw)]">
                <SelectItem v-for="item in competencyOptions" :key="item.id" :value="item.id">
                  <span class="flex flex-col items-start gap-0.5 py-0.5">
                    <span class="font-mono text-xs font-medium">{{ item.code }}</span>
                    <span class="text-muted-foreground text-xs whitespace-normal">
                      {{ item.description }}
                    </span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="!competencyOptions.length" class="text-muted-foreground text-xs">
              No active competencies are encoded for {{ form.grade }}, Quarter {{ form.quarter }}.
              Ask your administrator to add them.
            </p>
          </div>

          <div class="space-y-2">
            <Label for="topic">Lesson topic</Label>
            <Input
              id="topic"
              v-model="form.topic"
              placeholder="e.g. Adding fractions with dissimilar denominators"
              @input="topicTouched = true"
            />
            <p class="text-muted-foreground text-xs">
              Prefilled from the competency — reword it the way you say it in class.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="duration">Time duration</Label>
              <Select
                :model-value="String(form.duration)"
                @update:model-value="(v) => (form.duration = Number(v))"
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="minutes in DURATIONS" :key="minutes" :value="String(minutes)">
                    {{ minutes }} minutes
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="template">Lesson template</Label>
              <Select v-model="form.templateId">
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="template in catalog.activeTemplates"
                    :key="template.id"
                    :value="template.id"
                  >
                    {{ template.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div class="space-y-2">
            <Label for="learners"
              >Learner considerations
              <span class="text-muted-foreground font-normal">(optional)</span></Label
            >
            <Input
              id="learners"
              v-model="form.learners"
              placeholder="e.g. Two learners need large-print materials"
            />
          </div>

          <div class="space-y-2">
            <Label for="notes"
              >Notes for yourself
              <span class="text-muted-foreground font-normal">(optional)</span></Label
            >
            <Textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              placeholder="Reminders that should appear in the Remarks section of the plan."
            />
          </div>

          <Alert v-if="error" variant="destructive">
            <AlertCircle />
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit" :disabled="!canGenerate">
              <Loader2 v-if="plans.generating" class="animate-spin" />
              <Sparkles v-else />
              {{ plans.generating ? 'Generating…' : 'Generate lesson plan' }}
            </Button>
            <p class="text-muted-foreground text-xs">
              Takes a moment. You can edit everything afterwards.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Live summary -->
    <div class="space-y-6">
      <!-- The model's output, streamed in as it is generated -->
      <Card v-if="plans.generating || streamShown">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <Terminal class="size-4" />
            {{ plans.generating ? 'Generating…' : 'Model output' }}
          </CardTitle>
          <CardDescription>
            Model: <span class="font-mono text-xs">{{ generatorModel }}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref="streamBox"
            class="bg-muted/50 text-foreground/80 max-h-80 overflow-y-auto rounded-md p-3 text-sm leading-relaxed break-words whitespace-pre-wrap"
          >{{ streamShown
            }}<span
              v-if="plans.generating"
              class="bg-primary ml-0.5 inline-block h-4 w-[3px] translate-y-1 animate-pulse"
            /><span v-if="plans.generating && !streamShown" class="text-muted-foreground"
              >Waiting for the model…</span
            >
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Plan summary</CardTitle>
          <CardDescription>What the generator will receive.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 text-sm">
          <div v-if="plans.generating" class="space-y-3">
            <Skeleton class="h-4 w-2/3" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
            <Skeleton class="h-4 w-1/2" />
          </div>

          <template v-else>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Grade level</span>
              <span class="font-medium">{{ form.grade }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Quarter</span>
              <span class="font-medium">Quarter {{ form.quarter }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Duration</span>
              <span class="font-medium">{{ form.duration }} minutes</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Competency</span>
              <Badge v-if="selectedCompetency" variant="outline" class="font-mono text-[11px]">
                {{ selectedCompetency.code }}
              </Badge>
              <span v-else class="text-muted-foreground">Not selected</span>
            </div>

            <Separator />

            <div v-if="selectedCompetency" class="space-y-1">
              <p class="text-muted-foreground text-xs tracking-wide uppercase">
                {{ selectedCompetency.domain }}
              </p>
              <p class="leading-snug">{{ selectedCompetency.description }}</p>
            </div>
          </template>
        </CardContent>
      </Card>

      <Card v-if="selectedTemplate">
        <CardHeader>
          <CardTitle class="text-base">{{ selectedTemplate.name }}</CardTitle>
          <CardDescription>{{ selectedTemplate.description }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <div
            v-for="(section, index) in selectedTemplate.sections"
            :key="section"
            class="flex items-center gap-3 text-sm"
          >
            <span
              class="bg-muted text-muted-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium"
            >
              {{ index + 1 }}
            </span>
            <span class="flex-1">{{ section }}</span>
            <span class="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
              <Clock class="size-3" />
              ~{{ sectionMinutes }}m
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
