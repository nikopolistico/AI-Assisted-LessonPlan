<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsRoot, type TabsRootEmits, type TabsRootProps, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TabsRootEmits>()

const delegated = computed(() => {
  const { class: _class, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <TabsRoot data-slot="tabs" v-bind="forwarded" :class="cn('flex flex-col gap-4', props.class)">
    <slot />
  </TabsRoot>
</template>
