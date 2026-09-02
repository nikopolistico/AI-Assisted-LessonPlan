<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectItem, SelectItemIndicator, SelectItemText, type SelectItemProps } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectItem
    data-slot="select-item"
    :value="props.value"
    :disabled="props.disabled"
    :text-value="props.textValue"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
