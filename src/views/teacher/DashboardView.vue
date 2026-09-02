<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, ClipboardCheck, Clock, FileText, Sparkles } from 'lucide-vue-next'
import PageHeader from '@/components/app/PageHeader.vue'
import StatCard from '@/components/app/StatCard.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/plans'
import { useCatalogStore } from '@/stores/catalog'
import { relativeTime, romanQuarter } from '@/lib/format'

const auth = useAuthStore()
const plans = usePlansStore()
const catalog = useCatalogStore()

const myPlans = computed(() => (auth.currentUser ? plans.forOwner(auth.currentUser.id) : []))
const recent = computed(() => myPlans.value.slice(0, 5))
const drafts = computed(() => myPlans.value.filter((p) => p.status === 'draft'))
const finals = computed(() => myPlans.value.filter((p) => p.status === 'final'))
const minutesPlanned = computed(() => myPlans.value.reduce((sum, p) => sum + p.duration, 0))

const firstName = computed(() => auth.currentUser?.name.split(' ')[0] ?? 'there')

/** Competencies for the grades this teacher handles that have no plan yet. */
const suggestions = computed(() => {
  const covered = new Set(myPlans.value.map((p) => p.competencyId))
  const grades = auth.currentUser?.gradeLevels ?? []
  return catalog.activeCompetencies
    .filter((c) => grades.includes(c.grade) && !covered.has(c.id))
    .slice(0, 4)
})
</script>

<template>
  <PageHeader
    :title="`Good day, ${firstName}`"
    description="Draft a plan from a competency, or pick up where you left off."
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

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
      label="Lesson plans"
      :value="myPlans.length"
      hint="Saved in your account"
      :icon="FileText"
    />
    <StatCard label="Drafts" :value="drafts.length" hint="Not yet finalised" :icon="Clock" />
    <StatCard
      label="Finalised"
      :value="finals.length"
      hint="Ready to submit"
      :icon="ClipboardCheck"
    />
    <StatCard
      label="Minutes planned"
      :value="minutesPlanned"
      :hint="`Across ${myPlans.length} plan${myPlans.length === 1 ? '' : 's'}`"
      :icon="Clock"
    />
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Recent plans -->
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent lesson plans</CardTitle>
        <CardDescription>Your most recently updated drafts and final plans.</CardDescription>
      </CardHeader>
      <CardContent class="px-0">
        <EmptyState
          v-if="!recent.length"
          title="No lesson plans yet"
          description="Enter a topic and a competency, and the first draft is ready in a moment."
          :icon="FileText"
        >
          <Button as-child size="sm">
            <RouterLink to="/teacher/generate">Generate your first plan</RouterLink>
          </Button>
        </EmptyState>

        <ul v-else class="divide-y">
          <li v-for="plan in recent" :key="plan.id">
            <RouterLink
              :to="`/teacher/plans/${plan.id}`"
              class="hover:bg-muted/50 flex items-center gap-4 px-6 py-3 transition-colors"
            >
              <div class="min-w-0 flex-1 space-y-1">
                <p class="truncate text-sm font-medium">{{ plan.title }}</p>
                <p class="text-muted-foreground truncate text-xs">
                  {{ plan.grade }} · Quarter {{ romanQuarter(plan.quarter) }} ·
                  {{ plan.competencyCode }} · {{ plan.duration }} min
                </p>
              </div>
              <Badge
                :variant="plan.status === 'final' ? 'success' : 'secondary'"
                class="capitalize"
              >
                {{ plan.status }}
              </Badge>
              <span class="text-muted-foreground hidden w-20 text-right text-xs sm:inline">
                {{ relativeTime(plan.updatedAt) }}
              </span>
              <ArrowRight class="text-muted-foreground size-4 shrink-0" />
            </RouterLink>
          </li>
        </ul>
      </CardContent>
    </Card>

    <!-- Suggested competencies -->
    <Card>
      <CardHeader>
        <CardTitle>Not yet covered</CardTitle>
        <CardDescription>
          Competencies for
          {{ (auth.currentUser?.gradeLevels ?? []).join(' and ') || 'your grade levels' }}
          without a plan.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <EmptyState
          v-if="!suggestions.length"
          title="All caught up"
          description="Every active competency for your grade levels already has a plan."
        />

        <template v-else>
          <div v-for="(item, index) in suggestions" :key="item.id" class="space-y-2">
            <Separator v-if="index > 0" />
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="font-mono text-[11px]">{{ item.code }}</Badge>
                <span class="text-muted-foreground text-xs">Q{{ item.quarter }}</span>
              </div>
              <p class="text-sm leading-snug">{{ item.description }}</p>
              <Button variant="link" size="sm" class="h-auto p-0" as-child>
                <RouterLink :to="{ path: '/teacher/generate', query: { competency: item.id } }">
                  Plan this competency
                </RouterLink>
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
