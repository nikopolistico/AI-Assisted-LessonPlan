<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AlertDialogAction, type AlertDialogActionProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariants } from '@/components/ui/button'

const props = defineProps<
  AlertDialogActionProps & { class?: HTMLAttributes['class']; variant?: ButtonVariants['variant'] }
>()
</script>

<template>
  <AlertDialogAction
    data-slot="alert-dialog-action"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(buttonVariants({ variant: props.variant }), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>
