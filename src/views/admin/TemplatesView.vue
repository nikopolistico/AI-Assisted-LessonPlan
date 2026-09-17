<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  GripVertical,
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import type { LessonTemplate } from '@/types'
import { useCatalogStore } from '@/stores/catalog'

const catalog = useCatalogStore()

const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')

let seq = 0
const row = (text: string) => ({ id: seq++, text })

const form = reactive({
  name: '',
  approach: '',
  description: '',
  active: true,
  isDefault: false,
})
const sections = ref(['Activity', 'Analysis', 'Abstraction', 'Application'].map(row))

const sorted = computed(() =>
  catalog.templates.slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
)

function openCreate() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, { name: '', approach: '', description: '', active: true, isDefault: false })
  sections.value = ['Activity', 'Analysis', 'Abstraction', 'Application'].map(row)
  dialogOpen.value = true
}

function openEdit(template: LessonTemplate) {
  editingId.value = template.id
  formError.value = ''
  Object.assign(form, {
    name: template.name,
    approach: template.approach,
    description: template.description,
    active: template.active,
    isDefault: template.isDefault,
  })
  sections.value = template.sections.map(row)
  dialogOpen.value = true
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= sections.value.length) return
  const list = sections.value
  const item = list[index]
  const other = list[target]
  if (!item || !other) return
  list[index] = other
  list[target] = item
}

const saving = ref(false)

async function submit() {
  formError.value = ''
  const names = sections.value.map((s) => s.text.trim()).filter(Boolean)
  if (!form.name.trim()) {
    formError.value = 'Give the template a name.'
    return
  }
  if (names.length < 2) {
    formError.value = 'A template needs at least two sections.'
    return
  }

  const payload = {
    name: form.name.trim(),
    approach: form.approach.trim() || 'Custom',
    description: form.description.trim(),
    sections: names,
    active: form.active,
    isDefault: form.isDefault,
  }

  saving.value = true
  try {
    if (editingId.value) await catalog.updateTemplate(editingId.value, payload)
    else await catalog.addTemplate(payload)
    dialogOpen.value = false
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Could not save the template.'
  } finally {
    saving.value = false
  }
}

async function makeDefault(id: string) {
  try {
    await catalog.makeDefault(id)
  } catch {
    // no-op — the current default stays in place
  }
}

async function toggleActive(template: LessonTemplate) {
  try {
    await catalog.updateTemplate(template.id, { active: !template.active })
  } catch {
    // no-op
  }
}

const pendingDelete = ref<LessonTemplate | null>(null)

async function confirmDelete() {
  if (pendingDelete.value) await catalog.removeTemplate(pendingDelete.value.id)
  pendingDelete.value = null
}
</script>

<template>
  <PageHeader
    title="Lesson templates"
    description="The instructional models teachers can generate against. The default is preselected in the generator."
  >
    <template #actions>
      <Button @click="openCreate">
        <Plus />
        Add template
      </Button>
    </template>
  </PageHeader>

  <EmptyState
    v-if="!catalog.templates.length"
    title="No templates yet"
    description="Add at least one template so teachers have something to generate against."
    :icon="LayoutTemplate"
  >
    <Button size="sm" @click="openCreate">Add a template</Button>
  </EmptyState>

  <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <Card v-for="template in sorted" :key="template.id" :class="!template.active && 'opacity-70'">
      <CardHeader>
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 space-y-1">
            <CardTitle class="text-base">{{ template.name }}</CardTitle>
            <CardDescription>{{ template.approach }} model</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-sm" class="-mt-1 -mr-1">
                <MoreHorizontal />
                <span class="sr-only">Actions for {{ template.name }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem @select="openEdit(template)">
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                v-if="!template.isDefault"
                @select="makeDefault(template.id)"
              >
                <Star />
                Set as default
              </DropdownMenuItem>
              <DropdownMenuItem
                @select="toggleActive(template)"
              >
                {{ template.active ? 'Set inactive' : 'Set active' }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="pendingDelete = template">
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="flex flex-wrap gap-1.5 pt-1">
          <Badge v-if="template.isDefault" variant="info">Default</Badge>
          <Badge :variant="template.active ? 'success' : 'outline'">
            {{ template.active ? 'Active' : 'Inactive' }}
          </Badge>
          <Badge variant="secondary">{{ template.usageCount }} uses</Badge>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <p class="text-muted-foreground text-sm leading-relaxed">{{ template.description }}</p>
        <Separator />
        <ol class="space-y-1.5">
          <li
            v-for="(section, index) in template.sections"
            :key="section"
            class="flex items-center gap-2.5 text-sm"
          >
            <span
              class="bg-muted text-muted-foreground grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-medium"
            >
              {{ index + 1 }}
            </span>
            {{ section }}
          </li>
        </ol>
      </CardContent>
    </Card>
  </div>

  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ editingId ? 'Edit template' : 'Add template' }}</DialogTitle>
        <DialogDescription>
          Sections run in order and the lesson duration is divided across them.
        </DialogDescription>
      </DialogHeader>

      <form class="max-h-[65vh] space-y-4 overflow-y-auto pr-1" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="t-name">Template name</Label>
            <Input id="t-name" v-model="form.name" placeholder="Detailed Lesson Plan (DLP)" />
          </div>
          <div class="space-y-2">
            <Label for="t-approach">Instructional model</Label>
            <Input id="t-approach" v-model="form.approach" placeholder="7Es, 4As, 5Es…" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="t-description">Description</Label>
          <Textarea
            id="t-description"
            v-model="form.description"
            rows="2"
            placeholder="When teachers should reach for this template."
          />
        </div>

        <div class="space-y-2">
          <Label>Sections</Label>
          <div
            v-for="(section, index) in sections"
            :key="section.id"
            class="flex items-center gap-2"
          >
            <GripVertical class="text-muted-foreground size-4 shrink-0" />
            <Input v-model="section.text" class="h-9" :placeholder="`Section ${index + 1}`" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              :disabled="index === 0"
              @click="move(index, -1)"
            >
              <span aria-hidden="true">↑</span>
              <span class="sr-only">Move up</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              :disabled="index === sections.length - 1"
              @click="move(index, 1)"
            >
              <span aria-hidden="true">↓</span>
              <span class="sr-only">Move down</span>
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" @click="sections.splice(index, 1)">
              <Trash2 class="text-destructive" />
              <span class="sr-only">Remove section {{ index + 1 }}</span>
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" @click="sections.push(row(''))">
            <Plus />
            Add section
          </Button>
        </div>

        <label class="flex items-center justify-between rounded-lg border p-3">
          <span class="space-y-0.5">
            <span class="block text-sm font-medium">Available to teachers</span>
            <span class="text-muted-foreground block text-xs"
              >Inactive templates are hidden from the generator.</span
            >
          </span>
          <Switch v-model="form.active" />
        </label>

        <label class="flex items-center justify-between rounded-lg border p-3">
          <span class="space-y-0.5">
            <span class="block text-sm font-medium">Set as division default</span>
            <span class="text-muted-foreground block text-xs"
              >Preselected when a teacher opens the generator.</span
            >
          </span>
          <Switch v-model="form.isDefault" />
        </label>

        <p v-if="formError" class="text-destructive text-sm">{{ formError }}</p>

        <DialogFooter>
          <Button type="button" variant="outline" @click="dialogOpen = false">Cancel</Button>
          <Button type="submit" :disabled="saving">
            {{ editingId ? 'Save changes' : 'Add template' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <Dialog :open="pendingDelete !== null" @update:open="(v) => !v && (pendingDelete = null)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete {{ pendingDelete?.name }}?</DialogTitle>
        <DialogDescription>
          Plans already generated from this template keep their structure, but teachers will no
          longer be able to select it.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="pendingDelete = null">Cancel</Button>
        <Button variant="destructive" @click="confirmDelete">Delete template</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
