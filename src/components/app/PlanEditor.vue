<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Save, Trash2, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LessonPlan, PlanStatus } from '@/types'

const props = defineProps<{ plan: LessonPlan }>()
const emit = defineEmits<{ save: [Partial<LessonPlan>]; cancel: [] }>()

let seq = 0
const row = (text: string) => ({ id: seq++, text })

// String lists become keyed rows so v-model binds to a stable object field.
const title = ref(props.plan.title)
const duration = ref(props.plan.duration)
const status = ref<PlanStatus>(props.plan.status)
const objectives = ref(props.plan.objectives.map(row))
const materials = ref(props.plan.materials.map(row))
const sections = ref(props.plan.sections.map((s) => ({ ...s })))
const assessment = ref(props.plan.assessment)
const assignment = ref(props.plan.assignment)
const remarks = ref(props.plan.remarks)

const totalMinutes = computed(() => sections.value.reduce((sum, s) => sum + (s.minutes || 0), 0))

function submit() {
  emit('save', {
    title: title.value.trim() || props.plan.title,
    duration: Number(duration.value) || props.plan.duration,
    status: status.value,
    objectives: objectives.value.map((o) => o.text.trim()).filter(Boolean),
    materials: materials.value.map((m) => m.text.trim()).filter(Boolean),
    sections: sections.value.map((s) => ({ ...s, minutes: Number(s.minutes) || 0 })),
    assessment: assessment.value,
    assignment: assignment.value,
    remarks: remarks.value,
  })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-medium">Editing lesson plan</p>
        <p class="text-muted-foreground text-sm">
          Sections total {{ totalMinutes }} minutes against a {{ duration }}-minute period.
        </p>
      </div>
      <div class="flex gap-2">
        <Button type="button" variant="outline" @click="emit('cancel')">
          <X />
          Cancel
        </Button>
        <Button type="submit">
          <Save />
          Save changes
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Plan details</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2 sm:col-span-2">
          <Label for="edit-title">Title</Label>
          <Input id="edit-title" v-model="title" />
        </div>
        <div class="space-y-2">
          <Label for="edit-duration">Duration (minutes)</Label>
          <Input id="edit-duration" v-model.number="duration" type="number" min="10" step="5" />
        </div>
        <div class="space-y-2">
          <Label for="edit-status">Status</Label>
          <Select v-model="status">
            <SelectTrigger id="edit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">I. Objectives</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div
          v-for="(objective, index) in objectives"
          :key="objective.id"
          class="flex items-start gap-2"
        >
          <span class="text-muted-foreground mt-2.5 w-4 shrink-0 text-sm tabular-nums"
            >{{ index + 1 }}.</span
          >
          <Textarea v-model="objective.text" rows="2" class="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="mt-1"
            @click="objectives.splice(index, 1)"
          >
            <Trash2 class="text-destructive" />
            <span class="sr-only">Remove objective {{ index + 1 }}</span>
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" @click="objectives.push(row(''))">
          <Plus />
          Add objective
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">II. Learning resources</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div
          v-for="(material, index) in materials"
          :key="material.id"
          class="flex items-center gap-2"
        >
          <Input v-model="material.text" class="h-9" />
          <Button type="button" variant="ghost" size="icon-sm" @click="materials.splice(index, 1)">
            <Trash2 class="text-destructive" />
            <span class="sr-only">Remove material {{ index + 1 }}</span>
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" @click="materials.push(row(''))">
          <Plus />
          Add material
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">III. Procedure</CardTitle>
      </CardHeader>
      <CardContent class="space-y-5">
        <div
          v-for="(section, index) in sections"
          :key="section.key"
          class="border-border space-y-2 border-l-2 pl-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <Input v-model="section.title" class="h-8 max-w-64 font-medium" />
            <div class="flex items-center gap-1.5">
              <Input
                v-model.number="section.minutes"
                type="number"
                min="0"
                class="h-8 w-20 tabular-nums"
              />
              <span class="text-muted-foreground text-xs">min</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              class="ml-auto"
              @click="sections.splice(index, 1)"
            >
              <Trash2 class="text-destructive" />
              <span class="sr-only">Remove {{ section.title }}</span>
            </Button>
          </div>
          <Textarea v-model="section.body" rows="4" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">IV. Evaluation and assignment</CardTitle>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="space-y-2">
          <Label for="edit-assessment">Assessment</Label>
          <Textarea id="edit-assessment" v-model="assessment" rows="3" />
        </div>
        <Separator />
        <div class="space-y-2">
          <Label for="edit-assignment">Assignment</Label>
          <Textarea id="edit-assignment" v-model="assignment" rows="2" />
        </div>
        <Separator />
        <div class="space-y-2">
          <Label for="edit-remarks">Remarks</Label>
          <Textarea
            id="edit-remarks"
            v-model="remarks"
            rows="2"
            placeholder="Reminders for yourself"
          />
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-end gap-2">
      <Button type="button" variant="outline" @click="emit('cancel')">Cancel</Button>
      <Button type="submit">
        <Save />
        Save changes
      </Button>
    </div>
  </form>
</template>
