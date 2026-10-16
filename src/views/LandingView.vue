<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import LogoMark from '@/components/app/LogoMark.vue'
import logoUrl from '@/assets/images/logo.png'
import { useAuthStore } from '@/stores/auth'
import { homeFor } from '@/router'

const auth = useAuthStore()

const cta = computed(() =>
  auth.isAuthenticated
    ? { label: 'Open your workspace', to: homeFor(auth.role) }
    : { label: 'Sign in', to: '/login' },
)

const steps = [
  {
    title: 'Pick the competency',
    body: 'Choose your grade and quarter, then select the Most Essential Learning Competency (MELC) you are teaching.',
  },
  {
    title: 'Set the lesson',
    body: 'Enter the topic, time duration, and lesson template. Add notes about your learners if the class needs something specific.',
  },
  {
    title: 'Review and print',
    body: 'Edit any section of the generated plan, then print it or download a PDF for your files.',
  },
]

const teacherPoints = [
  'Generate a plan from your school’s MELC list',
  'Edit every section before you print',
  'Keep all your lesson plans in one list',
]

const adminPoints = [
  'Approve and manage teacher accounts',
  'Maintain the competency list and lesson templates',
  'See lesson plan activity in system reports',
]

function scrollToHow() {
  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <!-- Hero: the classroom board, with the actual deliverable on it. -->
    <section
      class="relative overflow-hidden text-[#f1f6ef]"
      style="background: radial-gradient(circle at 20% 10%, #2a5a3c 0%, #173628 55%, #0f2419 100%)"
    >
      <img
        :src="logoUrl"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -right-32 -bottom-32 size-[34rem] max-w-none opacity-[0.05] select-none"
      />

      <header class="relative mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <!-- The seal is transparent, so it sits straight on the board with a soft gold halo. -->
        <span
          class="grid size-12 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,rgb(255_212_68/0.30)_0%,transparent_70%)]"
        >
          <LogoMark class="size-10" />
        </span>
        <p class="font-display -ml-1 text-base font-semibold tracking-tight">Lesson Plan AI</p>
        <Button
          as-child
          variant="ghost"
          size="sm"
          class="ml-auto text-white hover:bg-white/10 hover:text-white"
        >
          <RouterLink :to="cta.to">{{ cta.label }}</RouterLink>
        </Button>
      </header>

      <div
        class="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-28"
      >
        <div class="max-w-xl space-y-6">
          <h1
            class="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Draft a DepEd Math lesson plan in minutes, not evenings.
          </h1>
          <p class="max-w-md text-base leading-relaxed text-[#f1f6ef]/75">
            Choose the competency, set your topic and time, and get a complete Daily Lesson Plan
            you can edit, print, or save as a PDF.
          </p>
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <Button
              as-child
              size="lg"
              class="bg-(--brand-gold) px-7 text-[#173628] hover:bg-(--brand-gold)/90"
            >
              <RouterLink :to="cta.to">{{ cta.label }}</RouterLink>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              class="text-white hover:bg-white/10 hover:text-white"
              @click="scrollToHow"
            >
              See how it works
            </Button>
          </div>
        </div>

        <!-- Sample sheet. Each line "writes" itself in once, on load. -->
        <figure class="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div
            class="sheet rounded-sm bg-white p-6 text-[13px] leading-snug text-[#1a1a1a] shadow-2xl shadow-black/40 lg:rotate-[1.5deg]"
          >
            <p class="ink border-b-2 border-[#1a1a1a] pb-2" style="--i: 0">
              <span class="block text-[10px] tracking-wide text-[#4a4a4a]">
                Department of Education
              </span>
              <span class="block text-lg font-bold">Daily Lesson Plan</span>
              <span class="block text-[#4a4a4a]">Mathematics · Grade 5 · Quarter I · 60 minutes</span>
            </p>

            <p class="ink mt-3 font-bold" style="--i: 1">
              Topic: Adding fractions with unlike denominators
            </p>

            <p class="ink mt-3 font-bold" style="--i: 2">I. Objectives</p>
            <ol class="mt-1 list-decimal space-y-1 pl-5">
              <li class="ink" style="--i: 3">
                Find the least common denominator of two fractions.
              </li>
              <li class="ink" style="--i: 4">
                Add unlike fractions and write the sum in simplest form.
              </li>
            </ol>

            <p class="ink mt-3 font-bold" style="--i: 5">III. Procedures</p>
            <ul class="mt-1 space-y-1">
              <li class="ink flex justify-between gap-4" style="--i: 6">
                <span>a. Review of equivalent fractions</span>
                <span class="text-[#6a6a6a]">10 min</span>
              </li>
              <li class="ink flex justify-between gap-4" style="--i: 7">
                <span>b. Presentation of the new lesson</span>
                <span class="text-[#6a6a6a]">15 min</span>
              </li>
              <li class="ink flex justify-between gap-4" style="--i: 8">
                <span>c. Guided practice</span>
                <span class="text-[#6a6a6a]">20 min</span>
              </li>
            </ul>
          </div>
          <figcaption class="mt-3 text-xs text-[#f1f6ef]/55 lg:text-right">
            Sample output. Every plan follows the same I–VI DepEd layout.
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- How it works: a real sequence, so the numbering earns its place. -->
    <section id="how-it-works" class="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 sm:px-6">
      <h2 class="font-display max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        From competency to printed plan in three steps
      </h2>

      <ol class="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        <li
          v-for="(step, i) in steps"
          :key="step.title"
          class="border-primary/30 border-t-2 pt-5 transition-colors duration-300 hover:border-primary"
        >
          <span class="font-display text-primary text-4xl font-bold tabular-nums">
            {{ i + 1 }}
          </span>
          <h3 class="mt-3 text-lg font-semibold">{{ step.title }}</h3>
          <p class="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
            {{ step.body }}
          </p>
        </li>
      </ol>
    </section>

    <!-- Two audiences, one rule between them. -->
    <section class="bg-muted/60">
      <div class="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-0">
        <div class="md:border-border md:border-r md:pr-12">
          <h2 class="font-display text-2xl font-bold tracking-tight">For teachers</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="point in teacherPoints" :key="point" class="flex gap-3 text-sm">
              <span class="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
              {{ point }}
            </li>
          </ul>
        </div>
        <div class="md:pl-12">
          <h2 class="font-display text-2xl font-bold tracking-tight">For administrators</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="point in adminPoints" :key="point" class="flex gap-3 text-sm">
              <span class="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
              {{ point }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Closing band -->
    <section class="bg-[#173628] text-[#f1f6ef]">
      <div
        class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-1">
          <h2 class="font-display text-2xl font-bold tracking-tight">
            Ready to plan your next lesson?
          </h2>
          <p class="text-sm text-[#f1f6ef]/70">
            Accounts are created by your school administrator.
          </p>
        </div>
        <Button
          as-child
          size="lg"
          class="bg-(--brand-gold) px-7 text-[#173628] hover:bg-(--brand-gold)/90"
        >
          <RouterLink :to="cta.to">{{ cta.label }}</RouterLink>
        </Button>
      </div>
      <div class="border-t border-white/10">
        <p class="mx-auto max-w-6xl px-4 py-5 text-xs text-[#f1f6ef]/50 sm:px-6">
          © {{ new Date().getFullYear() }} Agusan Pequeño Elementary School, Butuan City
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.font-display {
  font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
}

.sheet {
  font-family: Georgia, 'Times New Roman', serif;
}

/* One sequence on load: each line is written left to right, top to bottom. */
.ink {
  animation: write 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(0.35s + var(--i) * 0.28s);
}

@keyframes write {
  from {
    opacity: 0;
    clip-path: inset(0 100% 0 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ink {
    animation: none;
  }
}
</style>
