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
        'size-9 shrink-0 object-contain drop-shadow-[0_1px_3px_rgb(0_0_0/0.35)]',
        props.class,
      )
    "
  />
</template>
