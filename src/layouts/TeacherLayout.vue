<script setup lang="ts">
import { computed } from 'vue'
import { FileText, LayoutDashboard, Sparkles } from 'lucide-vue-next'
import DashboardShell from '@/components/app/DashboardShell.vue'
import type { NavItem } from '@/components/app/nav'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/plans'

const auth = useAuthStore()
const plans = usePlansStore()

const nav = computed<NavItem[]>(() => [
  { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard, exact: true },
  { label: 'Generate plan', to: '/teacher/generate', icon: Sparkles },
  {
    label: 'My lesson plans',
    to: '/teacher/plans',
    icon: FileText,
    badge: auth.currentUser ? plans.forOwner(auth.currentUser.id).length : 0,
  },
])
</script>

<template>
  <DashboardShell :nav="nav" workspace="Teacher workspace" />
</template>
