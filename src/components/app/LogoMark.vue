<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import logoUrl from '@/assets/images/logo.png'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <img
    :src="logoUrl"
    alt="Agusan Pequeño Elementary School"
    :class="
      cn(
        'size-9 shrink-0 rounded-lg bg-gradient-to from-[oklch(0.96_0.025_262)] to-[oklch(0.94_0.04_90)] object-contain p-0.5 ring-1 ring-black/5',
        props.class,
      )
    "
  />
</template>
