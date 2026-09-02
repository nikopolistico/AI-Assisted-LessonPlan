<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    :class="
      cn(
        'bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg font-semibold',
        props.class,
      )
    "
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"
        stroke-linejoin="round"
      />
      <path
        d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"
        stroke-linejoin="round"
      />
      <path d="M15.5 8.5h2.5M16.75 7.25v2.5M6 8.5h3M6 12h3" stroke-linecap="round" />
    </svg>
  </div>
</template>
