<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  BookOpen,
  FileText,
  LayoutTemplate,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import StatCard from '@/components/app/StatCard.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsersStore } from '@/stores/users'
import { useCatalogStore } from '@/stores/catalog'
import { usePlansStore } from '@/stores/plans'
import { formatDate, relativeTime } from '@/lib/format'

const users = useUsersStore()
const catalog = useCatalogStore()
const plans = usePlansStore()

const pending = computed(() => users.all.filter((u) => u.status === 'pending'))
const recentPlans = computed(() =>
  plans.all
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5),
)

const templateUse = computed(() => {
  const max = Math.max(1, ...catalog.templates.map((t) => t.usageCount))
  return catalog.templates
    .slice()
    .sort((a, b) => b.usageCount - a.usageCount)
    .map((t) => ({ ...t, share: Math.round((t.usageCount / max) * 100) }))
})

function ownerName(id: string) {
  return users.byId(id)?.name ?? 'Unknown teacher'
}
</script>

<template>
  <PageHeader
    title="System overview"
    description="Accounts, curriculum data and lesson plan activity across the division."
  >
    <template #actions>
      <Button variant="outline" as-child>
        <RouterLink to="/admin/reports">
          View full reports
          <ArrowRight />
        </RouterLink>
      </Button>
    </template>
  </PageHeader>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
      label="User accounts"
      :value="users.all.length"
      :hint="`${users.activeCount} active · ${users.teachers.length} teachers`"
      :icon="Users"
    />
    <StatCard
      label="Awaiting approval"
      :value="users.pendingCount"
      hint="New teacher registrations"
      :icon="UserCheck"
    />
    <StatCard
      label="MELCs encoded"
      :value="catalog.competencies.length"
      :hint="`${catalog.activeCompetencies.length} active`"
      :icon="BookOpen"
    />
    <StatCard
      label="Plans generated"
      :value="plans.totalGenerations"
      :hint="`${plans.totalPlans} plans saved`"
      :icon="Sparkles"
    />
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Pending approvals -->
    <Card>
      <CardHeader>
        <CardTitle>Pending approvals</CardTitle>
        <CardDescription>Teacher registrations that need a decision.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <EmptyState
          v-if="!pending.length"
          title="Nothing waiting"
          description="Every registration has been reviewed."
          :icon="UserCheck"
        />

        <template v-else>
          <div
            v-for="user in pending"
            :key="user.id"
            class="flex items-start justify-between gap-3 rounded-lg border p-3"
          >
            <div class="min-w-0 space-y-0.5">
              <p class="truncate text-sm font-medium">{{ user.name }}</p>
              <p class="text-muted-foreground truncate text-xs">{{ user.school }}</p>
              <p class="text-muted-foreground text-xs">
                Registered {{ formatDate(user.createdAt) }}
              </p>
            </div>
            <Button size="sm" @click="users.setStatus(user.id, 'active')">Approve</Button>
          </div>
          <Button variant="link" size="sm" class="h-auto p-0" as-child>
            <RouterLink to="/admin/users">Manage all accounts</RouterLink>
          </Button>
        </template>
      </CardContent>
    </Card>

    <!-- Recent plans -->
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle>Latest lesson plans</CardTitle>
        <CardDescription>Most recent activity across all teachers.</CardDescription>
      </CardHeader>
      <CardContent class="px-0">
        <EmptyState
          v-if="!recentPlans.length"
          title="No lesson plans yet"
          description="Activity appears here once teachers start generating."
          :icon="FileText"
        />
        <ul v-else class="divide-y">
          <li v-for="plan in recentPlans" :key="plan.id" class="flex items-center gap-4 px-6 py-3">
            <div class="min-w-0 flex-1 space-y-1">
              <p class="truncate text-sm font-medium">{{ plan.title }}</p>
              <p class="text-muted-foreground truncate text-xs">
                {{ ownerName(plan.ownerId) }} · {{ plan.grade }} · {{ plan.competencyCode }}
              </p>
            </div>
            <Badge :variant="plan.status === 'final' ? 'success' : 'secondary'" class="capitalize">
              {{ plan.status }}
            </Badge>
            <span class="text-muted-foreground hidden w-20 text-right text-xs sm:inline">
              {{ relativeTime(plan.updatedAt) }}
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>

  <!-- Template usage -->
  <Card>
    <CardHeader>
      <CardTitle>Template usage</CardTitle>
      <CardDescription
        >How often each lesson template has been used to generate a plan.</CardDescription
      >
    </CardHeader>
    <CardContent class="space-y-4">
      <div v-for="template in templateUse" :key="template.id" class="space-y-1.5">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="flex min-w-0 items-center gap-2">
            <LayoutTemplate class="text-muted-foreground size-4 shrink-0" />
            <span class="truncate font-medium">{{ template.name }}</span>
            <Badge v-if="template.isDefault" variant="info">Default</Badge>
            <Badge v-if="!template.active" variant="outline">Inactive</Badge>
          </span>
          <span class="text-muted-foreground shrink-0 tabular-nums">{{ template.usageCount }}</span>
        </div>
        <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            class="bg-primary h-full rounded-full transition-all"
            :style="{ width: `${template.share}%` }"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
