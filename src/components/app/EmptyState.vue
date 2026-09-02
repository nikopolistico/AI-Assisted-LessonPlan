<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ title: string; description?: string; icon?: Component }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div
      v-if="icon"
      class="bg-muted text-muted-foreground grid size-11 place-items-center rounded-full"
    >
      <component :is="icon" class="size-5" />
    </div>
    <div class="space-y-1">
      <p class="font-medium">{{ title }}</p>
      <p v-if="description" class="text-muted-foreground mx-auto max-w-sm text-sm">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
