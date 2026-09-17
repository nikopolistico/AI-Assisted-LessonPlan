<script setup lang="ts">
import { computed } from 'vue'
import { Activity, Download, FileText, Sparkles, TrendingUp, Users } from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import StatCard from '@/components/app/StatCard.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUsersStore } from '@/stores/users'
import { useCatalogStore } from '@/stores/catalog'
import { usePlansStore } from '@/stores/plans'
import { formatDate, romanQuarter } from '@/lib/format'

const users = useUsersStore()
const catalog = useCatalogStore()
const plans = usePlansStore()

const byQuarter = computed(() => {
  const counts = [1, 2, 3, 4].map((q) => plans.all.filter((p) => p.quarter === q).length)
  const max = Math.max(1, ...counts)
  return [1, 2, 3, 4].map((quarter, i) => ({
    quarter,
    count: counts[i] ?? 0,
    share: Math.round(((counts[i] ?? 0) / max) * 100),
  }))
})

const byDomain = computed(() => {
  const counts = new Map<string, number>()
  for (const plan of plans.all) {
    const domain = catalog.competencyById(plan.competencyId)?.domain ?? 'Unclassified'
    counts.set(domain, (counts.get(domain) ?? 0) + 1)
  }
  const max = Math.max(1, ...counts.values())
  return [...counts.entries()]
    .map(([domain, count]) => ({ domain, count, share: Math.round((count / max) * 100) }))
    .sort((a, b) => b.count - a.count)
})

/** Per-teacher activity, most active first. */
const byTeacher = computed(() =>
  users.teachers
    .map((teacher) => {
      const owned = plans.all.filter((p) => p.ownerId === teacher.id)
      return {
        teacher,
        plans: owned.length,
        finals: owned.filter((p) => p.status === 'final').length,
        generations: owned.reduce((sum, p) => sum + p.generationCount, 0),
        minutes: owned.reduce((sum, p) => sum + p.duration, 0),
      }
    })
    .sort((a, b) => b.plans - a.plans),
)

const coverage = computed(() => {
  const active = catalog.activeCompetencies
  const covered = new Set(plans.all.map((p) => p.competencyId))
  const hit = active.filter((c) => covered.has(c.id)).length
  return {
    hit,
    total: active.length,
    percent: active.length ? Math.round((hit / active.length) * 100) : 0,
  }
})

const averageRegenerations = computed(() =>
  plans.totalPlans ? (plans.totalGenerations / plans.totalPlans).toFixed(1) : '0.0',
)

function exportCsv() {
  const header = ['Title', 'Teacher', 'Quarter', 'MELC', 'Template', 'Duration', 'Status', 'Updated']
  const rows = plans.all.map((plan) => [
    plan.title,
    users.byId(plan.ownerId)?.name ?? '',
    `Q${plan.quarter}`,
    plan.competencyCode,
    plan.templateName,
    String(plan.duration),
    plan.status,
    formatDate(plan.updatedAt),
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'lesson-plan-report.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <PageHeader
    title="System reports"
    description="Grade 3 Mathematics planning activity across teachers, quarters and curriculum domains."
  >
    <template #actions>
      <Button variant="outline" @click="exportCsv">
        <Download />
        Export CSV
      </Button>
    </template>
  </PageHeader>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
      label="Lesson plans"
      :value="plans.totalPlans"
      hint="Grade 3 Mathematics"
      :icon="FileText"
    />
    <StatCard
      label="Generations"
      :value="plans.totalGenerations"
      :hint="`${averageRegenerations} per plan on average`"
      :icon="Sparkles"
    />
    <StatCard
      label="Active teachers"
      :value="byTeacher.filter((row) => row.plans > 0).length"
      :hint="`of ${users.teachers.length} registered`"
      :icon="Users"
    />
    <StatCard
      label="MELC coverage"
      :value="`${coverage.percent}%`"
      :hint="`${coverage.hit} of ${coverage.total} active competencies planned`"
      :icon="TrendingUp"
    />
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Plans per quarter</CardTitle>
        <CardDescription>Where planning activity is concentrated in the school year.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <EmptyState v-if="!plans.totalPlans" title="No plans yet" :icon="Activity" />
        <template v-else>
          <div v-for="row in byQuarter" :key="row.quarter" class="space-y-1.5">
            <div class="flex items-center justify-between text-sm">
              <span>Quarter {{ romanQuarter(row.quarter) }}</span>
              <span class="text-muted-foreground tabular-nums">{{ row.count }}</span>
            </div>
            <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                class="bg-chart-1 h-full rounded-full transition-all"
                :style="{ width: `${row.share}%` }"
              />
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Plans per curriculum domain</CardTitle>
        <CardDescription>Across the five Grade 3 Mathematics domains.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <EmptyState v-if="!byDomain.length" title="No plans yet" :icon="Activity" />
        <div v-for="row in byDomain" :key="row.domain" class="space-y-1.5">
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="truncate">{{ row.domain }}</span>
            <span class="text-muted-foreground shrink-0 tabular-nums">{{ row.count }}</span>
          </div>
          <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              class="bg-chart-3 h-full rounded-full transition-all"
              :style="{ width: `${row.share}%` }"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <Card class="gap-0 py-0">
    <CardHeader class="p-6">
      <CardTitle>Teacher activity</CardTitle>
      <CardDescription>Plans saved, finalised and regenerated per account.</CardDescription>
    </CardHeader>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="pl-6">Teacher</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right">Plans</TableHead>
            <TableHead class="text-right">Finalised</TableHead>
            <TableHead class="text-right">Generations</TableHead>
            <TableHead class="text-right">Minutes</TableHead>
            <TableHead class="pr-6">Last login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="!byTeacher.length" :colspan="8">No teacher accounts yet.</TableEmpty>

          <TableRow v-for="row in byTeacher" :key="row.teacher.id">
            <TableCell class="pl-6 font-medium">{{ row.teacher.name }}</TableCell>
            <TableCell class="max-w-56">
              <span class="text-muted-foreground line-clamp-1 text-sm">{{
                row.teacher.school
              }}</span>
            </TableCell>
            <TableCell>
              <Badge
                :variant="
                  row.teacher.status === 'active'
                    ? 'success'
                    : row.teacher.status === 'pending'
                      ? 'warning'
                      : 'outline'
                "
                class="capitalize"
              >
                {{ row.teacher.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-right tabular-nums">{{ row.plans }}</TableCell>
            <TableCell class="text-right tabular-nums">{{ row.finals }}</TableCell>
            <TableCell class="text-right tabular-nums">{{ row.generations }}</TableCell>
            <TableCell class="text-right tabular-nums">{{ row.minutes }}</TableCell>
            <TableCell class="text-muted-foreground pr-6 whitespace-nowrap">
              {{ formatDate(row.teacher.lastLogin) }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
