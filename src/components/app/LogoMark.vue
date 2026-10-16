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
<<<<<<< HEAD
        'size-9 shrink-0 rounded-lg bg-gradient-to-br from-[#45598b] to-(--brand-dark) object-contain p-0.5 ring-1 ring-black/5',
=======
        'size-9 shrink-0 object-contain drop-shadow-[0_1px_3px_rgb(0_0_0/0.35)]',
>>>>>>> eac4199a1d51e5693e9998e10c4381c43ee9545f
        props.class,
      )
    "
  />
</template>
