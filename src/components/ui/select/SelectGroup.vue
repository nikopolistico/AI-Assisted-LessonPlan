<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectGroup, type SelectGroupProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SelectGroupProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectGroup
    data-slot="select-group"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn('p-1', props.class)"
  >
    <slot />
  </SelectGroup>
</template>
