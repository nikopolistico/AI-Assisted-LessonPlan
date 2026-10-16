<script setup lang="ts">
import { computed, watch } from 'vue'
import { CheckCircle2, Loader2, LogOut, XCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuthStore, type AuthStatus } from '@/stores/auth'

const auth = useAuthStore()

type Tone = 'busy' | 'success' | 'failed'

const STEPS: Record<
  Exclude<AuthStatus, 'idle'>,
  { title: string; detail: string; progress: number; tone: Tone }
> = {
  verifying: {
    title: 'Verifying account…',
    detail: 'Checking your email and password.',
    progress: 35,
    tone: 'busy',
  },
  'loading-profile': {
    title: 'Loading your profile…',
    detail: 'Getting your workspace ready.',
    progress: 70,
    tone: 'busy',
  },
  success: {
    title: 'Signed in successfully',
    detail: 'Redirecting you to your dashboard.',
    progress: 100,
    tone: 'success',
  },
  failed: {
    title: 'Failed to authenticate',
    detail: '',
    progress: 100,
    tone: 'failed',
  },
  'signing-out': {
    title: 'Signing out…',
    detail: 'Ending your session securely.',
    progress: 50,
    tone: 'busy',
  },
  'signed-out': {
    title: 'Signed out successfully',
    detail: 'See you next time!',
    progress: 100,
    tone: 'success',
  },
}

const step = computed(() => (auth.status === 'idle' ? null : STEPS[auth.status]))
const detail = computed(() => (auth.status === 'failed' ? auth.error : step.value?.detail))

// Success states clear themselves; a failure waits for the user to dismiss it.
watch(
  () => auth.status,
  (status) => {
    if (status !== 'success' && status !== 'signed-out') return
    setTimeout(
      () => {
        if (auth.status === status) auth.clearStatus()
      },
      status === 'success' ? 1200 : 1500,
    )
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="step"
      class="bg-background/80 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-live="assertive"
      :aria-busy="step.tone === 'busy'"
    >
      <div class="bg-card w-full max-w-xs space-y-4 rounded-xl border p-6 text-center shadow-lg">
        <div
          class="mx-auto flex size-12 items-center justify-center rounded-full"
          :class="{
            'bg-primary/10 text-primary': step.tone === 'busy',
            'bg-(--brand-green)/15 text-(--brand-green)': step.tone === 'success',
            'bg-destructive/10 text-destructive': step.tone === 'failed',
          }"
        >
          <Loader2 v-if="step.tone === 'busy'" class="size-6 animate-spin" />
          <XCircle v-else-if="step.tone === 'failed'" class="size-6" />
          <LogOut v-else-if="auth.status === 'signed-out'" class="size-6" />
          <CheckCircle2 v-else class="size-6" />
        </div>

        <div class="space-y-1">
          <p class="font-semibold">{{ step.title }}</p>
          <p class="text-muted-foreground text-sm">{{ detail }}</p>
        </div>

        <Progress
          :model-value="step.progress"
          class="h-1.5"
          :indicator-class="{
            'duration-500': true,
            'bg-(--brand-green)': step.tone === 'success',
            'bg-destructive': step.tone === 'failed',
          }"
        />

        <Button v-if="step.tone === 'failed'" class="w-full" @click="auth.clearStatus()">
          Try again
        </Button>
      </div>
    </div>
  </Transition>
</template>
