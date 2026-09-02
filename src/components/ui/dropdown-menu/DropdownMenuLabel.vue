<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuLabel, type DropdownMenuLabelProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DropdownMenuLabelProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <DropdownMenuLabel
    data-slot="dropdown-menu-label"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn('px-2 py-1.5 text-sm font-medium', props.class)"
  >
    <slot />
  </DropdownMenuLabel>
</template>
