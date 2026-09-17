<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AlertDialogDescription, type AlertDialogDescriptionProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <AlertDialogDescription
    data-slot="alert-dialog-description"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
