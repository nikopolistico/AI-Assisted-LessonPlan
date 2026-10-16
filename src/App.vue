<script setup lang="ts">
import { RouterView } from 'vue-router'
import AuthStatusOverlay from '@/components/app/AuthStatusOverlay.vue'
import { useTheme } from '@/composables/useTheme'

useTheme()
</script>

<template>
  <RouterView />
  <AuthStatusOverlay />
</template>
