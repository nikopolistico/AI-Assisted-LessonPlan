<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, BookOpen, LayoutDashboard, LayoutTemplate, Users } from 'lucide-vue-next'
import DashboardShell from '@/components/app/DashboardShell.vue'
import type { NavItem } from '@/components/app/nav'
import { useUsersStore } from '@/stores/users'

const users = useUsersStore()

const nav = computed<NavItem[]>(() => [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'User accounts', to: '/admin/users', icon: Users, badge: users.pendingCount },
  { label: 'Math competencies', to: '/admin/competencies', icon: BookOpen },
  { label: 'Lesson templates', to: '/admin/templates', icon: LayoutTemplate },
  { label: 'System reports', to: '/admin/reports', icon: BarChart3 },
])
</script>

<template>
  <DashboardShell :nav="nav" workspace="Administration" />
</template>
