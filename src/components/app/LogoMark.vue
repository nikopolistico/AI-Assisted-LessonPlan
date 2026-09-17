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
        'size-9 shrink-0 rounded-lg bg-gradient-to-br from-dark-200 to-slate-400 object-contain p-0.5 ring-1 ring-black/5',
        props.class,
      )
    "
  />
</template>
