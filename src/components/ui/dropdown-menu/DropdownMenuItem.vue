<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuItem, type DropdownMenuItemProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<
  DropdownMenuItemProps & {
    class?: HTMLAttributes['class']
    variant?: 'default' | 'destructive'
    inset?: boolean
  }
>()
</script>

<template>
  <DropdownMenuItem
    data-slot="dropdown-menu-item"
    :data-variant="props.variant ?? 'default'"
    :data-inset="props.inset ? '' : undefined"
    :disabled="props.disabled"
    :text-value="props.textValue"
    :as="props.as"
    :as-child="props.asChild"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
