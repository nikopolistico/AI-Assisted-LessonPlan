<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'

defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: Component
}>()
</script>

<template>
  <Card class="gap-0 py-5">
    <CardContent class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ label }}</p>
        <p class="text-2xl font-semibold tabular-nums">{{ value }}</p>
        <p v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
      </div>
      <div
        v-if="icon"
        class="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg"
      >
        <component :is="icon" class="size-4.5" />
      </div>
    </CardContent>
  </Card>
</template>
