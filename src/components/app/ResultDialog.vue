<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  open: boolean
  kind: 'success' | 'error'
  title: string
  description?: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="items-center text-center sm:max-w-sm" :show-close-button="false">
      <!-- Keyed on kind so the drawing animation replays for each new result. -->
      <svg
        :key="kind"
        class="result-art mx-auto size-32"
        viewBox="0 0 120 120"
        fill="none"
        role="img"
        :aria-label="kind === 'success' ? 'Success' : 'Something went wrong'"
      >
        <template v-if="kind === 'success'">
          <circle class="art-halo" cx="60" cy="60" r="52" fill="#689d4b" fill-opacity="0.14" />
          <circle class="art-disc" cx="60" cy="60" r="38" fill="#2c6a3c" />
          <path
            class="art-stroke"
            d="M43 61 l12 12 l23 -26"
            stroke="#ffffff"
            stroke-width="8"
            stroke-linecap="round"
            stroke-linejoin="round"
            pathLength="1"
          />
          <!-- Chalk-yellow sparks -->
          <g class="art-spark" stroke="#ffd444" stroke-width="4" stroke-linecap="round">
            <path d="M101 24 v10 M96 29 h10" />
            <path d="M18 38 v7 M14.5 41.5 h7" />
            <path d="M97 92 l5 5 M102 92 l-5 5" />
          </g>
          <circle class="art-spark" cx="22" cy="86" r="3.5" fill="#eb7f31" />
        </template>

        <template v-else>
          <circle class="art-halo" cx="60" cy="60" r="52" fill="#dc2626" fill-opacity="0.12" />
          <g class="art-shake">
            <circle class="art-disc" cx="60" cy="60" r="38" fill="#c2312d" />
            <path
              class="art-stroke"
              d="M60 40 v24"
              stroke="#ffffff"
              stroke-width="8"
              stroke-linecap="round"
              pathLength="1"
            />
            <circle class="art-dot" cx="60" cy="78" r="4.5" fill="#ffffff" />
          </g>
          <g class="art-spark" stroke="#eb7f31" stroke-width="4" stroke-linecap="round">
            <path d="M99 30 l6 -6" />
            <path d="M16 34 l-6 -5" />
            <path d="M100 90 l6 5" />
          </g>
        </template>
      </svg>

      <DialogHeader class="items-center text-center sm:text-center">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>

      <DialogFooter class="w-full sm:justify-center">
        <Button
          class="w-full sm:w-auto sm:min-w-28"
          :variant="kind === 'error' ? 'outline' : 'default'"
          @click="emit('update:open', false)"
        >
          {{ kind === 'success' ? 'Done' : 'Close' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.art-halo {
  transform-origin: 60px 60px;
  animation: art-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.art-disc {
  transform-origin: 60px 60px;
  animation: art-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both;
}
.art-stroke {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: art-draw 0.4s ease-out 0.35s forwards;
}
.art-dot {
  opacity: 0;
  animation: art-fade 0.2s ease-out 0.6s forwards;
}
.art-spark {
  transform-origin: 60px 60px;
  opacity: 0;
  animation: art-spark 0.5s ease-out 0.55s forwards;
}
.art-shake {
  transform-origin: 60px 60px;
  animation: art-shake 0.4s ease-in-out 0.5s both;
}

@keyframes art-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}
@keyframes art-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes art-fade {
  to {
    opacity: 1;
  }
}
@keyframes art-spark {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes art-shake {
  25% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .art-halo,
  .art-disc,
  .art-shake {
    animation: none;
  }
  .art-stroke {
    animation: none;
    stroke-dashoffset: 0;
  }
  .art-dot,
  .art-spark {
    animation: none;
    opacity: 1;
  }
}
</style>
