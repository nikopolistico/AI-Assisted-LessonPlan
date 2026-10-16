<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
<<<<<<< HEAD
import { useWindowScroll } from '@vueuse/core'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Download,
  LayoutTemplate,
  Mail,
  MapPin,
  Moon,
  PencilLine,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from 'lucide-vue-next'
import logoUrl from '@/assets/images/logo.png'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/useTheme'
import { vReveal } from '@/lib/reveal'

const { isDark, toggle } = useTheme()

// The header sits transparent over the navy hero, then turns solid once the page moves.
const { y } = useWindowScroll()
const scrolled = computed(() => y.value > 24)

const links = [
  { label: 'About', hash: '#about' },
  { label: 'Features', hash: '#features' },
  { label: 'How it works', hash: '#how-it-works' },
  { label: 'Contact', hash: '#contact' },
]

const contacts = [
  { icon: Phone, label: '+63 967 659 5166', href: 'tel:+639676595166' },
  { icon: Mail, label: 'nik2polistico@gmail.com', href: 'mailto:nik2polistico@gmail.com' },
  { icon: MapPin, label: 'Agusan Pequeño, Butuan City', href: null },
]

const stats = [
  { value: 'Grade 3', label: 'Mathematics lessons' },
  { value: 'MELC', label: 'aligned competencies' },
  { value: 'Q1 – Q4', label: 'all four quarters' },
  { value: '30–120', label: 'minute sessions' },
]

const features = [
  {
    icon: BookOpenCheck,
    title: 'Aligned to the MELCs',
    body: 'Pick the grade, quarter and competency, and every plan is built around the learning code you chose.',
  },
  {
    icon: Sparkles,
    title: 'Drafted by AI in moments',
    body: 'Objectives, subject matter, procedure and assessment are written for you, ready to review.',
  },
  {
    icon: PencilLine,
    title: 'Yours to edit',
    body: 'Adjust any section by hand, or regenerate the plan until it fits your class.',
  },
  {
    icon: LayoutTemplate,
    title: 'School-approved templates',
    body: 'Administrators manage the lesson templates, so every plan follows the same structure.',
  },
  {
    icon: Download,
    title: 'Print and download',
    body: 'Save plans to your library and export them as PDF or print them for submission.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure, role-based access',
    body: 'Teachers see their own plans; administrators manage accounts, content and reports.',
  },
]

const steps = [
  {
    icon: ClipboardList,
    title: 'Enter the lesson details',
    body: 'Topic, competency, grade level, quarter and how long the session runs.',
  },
  {
    icon: Sparkles,
    title: 'Generate the plan',
    body: 'The AI drafts a complete lesson plan using your school’s template.',
  },
  {
    icon: CheckCircle2,
    title: 'Review, refine, submit',
    body: 'Edit what you need, then save, print or download it.',
  },
]

const audiences = [
  {
    icon: Users,
    title: 'For teachers',
    points: [
      'Generate a lesson plan from a few details',
      'Edit, regenerate and keep a personal library',
      'Print or download plans for submission',
    ],
  },
  {
    icon: BarChart3,
    title: 'For administrators',
    points: [
      'Manage teacher accounts and access',
      'Maintain MELC competencies and templates',
      'Track usage with system reports and CSV export',
    ],
  },
]

const year = new Date().getFullYear()
</script>

<template>
  <div class="bg-background min-h-screen overflow-x-clip">
    <!-- Header -->
    <header
      class="fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow,color] duration-300"
      :class="
        scrolled
          ? 'bg-background/85 text-foreground border-b shadow-xs backdrop-blur'
          : 'border-b border-transparent text-white'
      "
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <RouterLink to="/" class="flex min-w-0 items-center gap-2.5">
          <img
            :src="logoUrl"
            alt=""
            class="size-9 shrink-0 rounded-lg bg-gradient-to-br from-[#45598b] to-(--brand-navy) object-contain p-0.5 ring-1 ring-black/10"
          />
          <span class="truncate text-sm font-semibold tracking-tight">Lesson Plan AI</span>
        </RouterLink>

        <nav class="ml-6 hidden items-center gap-1 md:flex">
          <RouterLink
            v-for="link in links"
            :key="link.hash"
            :to="{ hash: link.hash }"
            class="rounded-md px-3 py-2 text-sm font-medium opacity-75 transition-opacity hover:opacity-100"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            :class="!scrolled && 'text-white hover:bg-white/10 hover:text-white'"
            :title="isDark ? 'Switch to light' : 'Switch to dark'"
            @click="toggle"
          >
            <Sun v-if="isDark" />
            <Moon v-else />
            <span class="sr-only">Toggle theme</span>
          </Button>
          <Button
            as-child
            size="sm"
            :class="!scrolled && 'bg-(--brand-gold) text-(--brand-navy) hover:bg-(--brand-gold)/90'"
          >
            <RouterLink to="/login">Sign in</RouterLink>
          </Button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section
      class="relative overflow-hidden pt-16 text-white"
      style="background: radial-gradient(circle at 20% 10%, #45598b 0%, #1c2d52 70%)"
=======
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
>>>>>>> eac4199a1d51e5693e9998e10c4381c43ee9545f
    >
      <img
        :src="logoUrl"
        alt=""
        aria-hidden="true"
<<<<<<< HEAD
        class="pointer-events-none absolute -right-32 -bottom-40 size-[36rem] max-w-none opacity-[0.05] select-none"
      />

      <div
        class="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28"
      >
        <div class="space-y-6">
          <p
            v-reveal
            class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15"
          >
            <span class="size-1.5 rounded-full bg-(--brand-gold)" />
            Agusan Pequeño Elementary School · Butuan City
          </p>
          <h1 v-reveal="80" class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Mathematics lesson plans,
            <span class="text-(--brand-gold)">drafted in minutes.</span>
          </h1>
          <p v-reveal="160" class="max-w-lg text-base text-white/70 sm:text-lg">
            An AI-assisted planning tool that helps DepEd teachers turn a competency into a
            complete, ready-to-teach lesson plan, so more time goes to the class and less to
            paperwork.
          </p>
          <div v-reveal="240" class="flex flex-wrap gap-3">
            <Button
              as-child
              size="lg"
              class="bg-(--brand-gold) text-(--brand-navy) hover:bg-(--brand-gold)/90"
            >
              <RouterLink to="/login">
                Get started
                <ArrowRight />
              </RouterLink>
            </Button>
            <Button
              as-child
              size="lg"
              variant="outline"
              class="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <RouterLink :to="{ hash: '#about' }">Learn more</RouterLink>
            </Button>
          </div>
        </div>

        <!-- Lesson plan preview -->
        <div v-reveal="200" class="relative mx-auto w-full max-w-md lg:mr-0">
          <div
            class="absolute -inset-4 rounded-3xl bg-(--brand-gold)/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            class="bg-card text-card-foreground relative space-y-5 rounded-2xl p-6 shadow-2xl ring-1 ring-black/5"
            aria-hidden="true"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Daily Lesson Plan
                </p>
                <p class="font-semibold">Grade 3 Mathematics · Quarter 1</p>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--brand-green)/15 px-2 py-0.5 text-xs font-medium text-(--brand-green)"
              >
                <CheckCircle2 class="size-3" />
                MELC
              </span>
            </div>

            <div
              v-for="(section, i) in ['I. Objectives', 'II. Subject Matter', 'III. Procedure']"
              :key="section"
              class="space-y-2"
            >
              <p class="text-sm font-semibold">{{ section }}</p>
              <div class="bg-muted h-2 rounded-full" :class="['w-11/12', 'w-4/5', 'w-full'][i]" />
              <div class="bg-muted h-2 rounded-full" :class="['w-3/4', 'w-2/3', 'w-5/6'][i]" />
            </div>

            <div class="flex items-center justify-between border-t pt-4">
              <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <Sparkles class="size-3.5 text-(--brand-orange)" />
                Generated by AI
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs font-medium">
                <Download class="size-3.5" />
                Ready to download
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-b">
      <div class="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div v-for="(stat, i) in stats" :key="stat.label" v-reveal="i * 80" class="text-center">
          <p class="text-2xl font-semibold tracking-tight">{{ stat.value }}</p>
          <p class="text-muted-foreground text-sm">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- About -->
    <section id="about" class="scroll-mt-16">
      <div class="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div class="space-y-4">
          <p v-reveal class="text-sm font-semibold tracking-wide text-(--brand-orange) uppercase">
            About us
          </p>
          <h2 v-reveal="80" class="text-3xl font-semibold tracking-tight text-balance">
            Built for the teachers of Agusan Pequeño Elementary School
          </h2>
          <p v-reveal="160" class="text-muted-foreground">
            Writing a lesson plan for every session takes hours each week. Lesson Plan AI was
            created to lighten that load. It gives teachers a well-structured first draft that
            follows the Most Essential Learning Competencies and the school’s own template.
          </p>
          <p v-reveal="240" class="text-muted-foreground">
            The teacher stays in charge. Every plan can be reviewed, edited and regenerated before
            it reaches the classroom, and administrators keep the competencies, templates and
            accounts up to date for everyone.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div
            v-reveal="120"
            class="bg-card rounded-xl border p-6 shadow-xs transition-shadow hover:shadow-md"
          >
            <div
              class="bg-primary/10 text-primary mb-4 flex size-10 items-center justify-center rounded-lg"
            >
              <Sparkles class="size-5" />
            </div>
            <h3 class="font-semibold">Our mission</h3>
            <p class="text-muted-foreground mt-2 text-sm">
              Give every teacher more time to teach by making lesson planning faster, clearer and
              consistent with DepEd standards.
            </p>
          </div>
          <div
            v-reveal="220"
            class="bg-card rounded-xl border p-6 shadow-xs transition-shadow hover:shadow-md sm:translate-y-8"
          >
            <div
              class="mb-4 flex size-10 items-center justify-center rounded-lg bg-(--brand-green)/15 text-(--brand-green)"
            >
              <BookOpenCheck class="size-5" />
            </div>
            <h3 class="font-semibold">Our vision</h3>
            <p class="text-muted-foreground mt-2 text-sm">
              A school where quality, competency-based lessons are prepared with ease and every
              learner benefits from well-planned instruction.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="bg-muted/50 scroll-mt-16 border-y">
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div class="mx-auto max-w-2xl space-y-3 text-center">
          <p v-reveal class="text-sm font-semibold tracking-wide text-(--brand-orange) uppercase">
            Features
          </p>
          <h2 v-reveal="80" class="text-3xl font-semibold tracking-tight text-balance">
            Everything a lesson plan needs, in one place
          </h2>
        </div>

        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(feature, i) in features"
            :key="feature.title"
            v-reveal="(i % 3) * 100"
            class="group bg-card rounded-xl border p-6 shadow-xs transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div
              class="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 flex size-10 items-center justify-center rounded-lg transition-colors duration-300"
            >
              <component :is="feature.icon" class="size-5" />
            </div>
            <h3 class="font-semibold">{{ feature.title }}</h3>
            <p class="text-muted-foreground mt-2 text-sm">{{ feature.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="scroll-mt-16">
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div class="mx-auto max-w-2xl space-y-3 text-center">
          <p v-reveal class="text-sm font-semibold tracking-wide text-(--brand-orange) uppercase">
            How it works
          </p>
          <h2 v-reveal="80" class="text-3xl font-semibold tracking-tight text-balance">
            From competency to classroom in three steps
          </h2>
        </div>

        <ol class="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          <!-- Connector line behind the step badges (desktop). -->
          <div
            class="bg-border absolute top-6 right-[16.66%] left-[16.66%] hidden h-px md:block"
            aria-hidden="true"
          />
          <li
            v-for="(step, i) in steps"
            :key="step.title"
            v-reveal="i * 150"
            class="relative flex flex-col items-center text-center"
          >
            <div
              class="bg-primary text-primary-foreground ring-background relative flex size-12 items-center justify-center rounded-full shadow-md ring-8"
            >
              <component :is="step.icon" class="size-5" />
            </div>
            <p class="text-muted-foreground mt-4 text-xs font-semibold tracking-wide uppercase">
              Step {{ i + 1 }}
            </p>
            <h3 class="mt-1 font-semibold">{{ step.title }}</h3>
            <p class="text-muted-foreground mt-2 max-w-xs text-sm">{{ step.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Audiences -->
    <section class="bg-muted/50 border-y">
      <div class="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2 lg:py-24">
        <div
          v-for="(audience, i) in audiences"
          :key="audience.title"
          v-reveal="i * 120"
          class="bg-card rounded-xl border p-8 shadow-xs"
        >
          <div class="flex items-center gap-3">
            <div
              class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg"
            >
              <component :is="audience.icon" class="size-5" />
            </div>
            <h3 class="text-lg font-semibold">{{ audience.title }}</h3>
          </div>
          <ul class="mt-6 space-y-3">
            <li v-for="point in audience.points" :key="point" class="flex gap-3 text-sm">
              <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-(--brand-green)" />
              <span class="text-muted-foreground">{{ point }}</span>
=======
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
>>>>>>> eac4199a1d51e5693e9998e10c4381c43ee9545f
            </li>
          </ul>
        </div>
      </div>
    </section>

<<<<<<< HEAD
    <!-- Call to action -->
    <section class="px-4 py-20 sm:px-6 lg:py-28">
      <div
        v-reveal
        class="relative mx-auto max-w-4xl overflow-hidden rounded-2xl px-6 py-14 text-center text-white shadow-xl sm:px-12"
        style="background: radial-gradient(circle at 30% 0%, #45598b 0%, #1c2d52 75%)"
      >
        <h2 class="text-3xl font-semibold tracking-tight text-balance">
          Ready to plan your next lesson?
        </h2>
        <p class="mx-auto mt-3 max-w-lg text-white/70">
          Sign in with your school account and create your first AI-assisted lesson plan today.
        </p>
        <Button
          as-child
          size="lg"
          class="mt-8 bg-(--brand-gold) text-(--brand-navy) hover:bg-(--brand-gold)/90"
        >
          <RouterLink to="/login">
            Sign in to get started
            <ArrowRight />
          </RouterLink>
        </Button>
      </div>
    </section>

    <!-- Footer -->
    <footer id="contact" class="bg-muted/50 scroll-mt-16 border-t">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1.25fr]">
        <div v-reveal class="space-y-4">
          <div class="flex items-center gap-2.5">
            <img
              :src="logoUrl"
              alt=""
              class="size-9 rounded-lg bg-gradient-to-br from-[#45598b] to-(--brand-navy) object-contain p-0.5"
            />
            <div class="min-w-0">
              <p class="text-sm font-semibold">Lesson Plan AI</p>
              <p class="text-muted-foreground text-xs">Agusan Pequeño Elementary School</p>
            </div>
          </div>
          <p class="text-muted-foreground max-w-xs text-sm">
            AI-assisted Mathematics lesson planning for DepEd teachers in Butuan City.
          </p>
        </div>

        <div v-reveal="100" class="space-y-4">
          <h3 class="text-sm font-semibold">Quick links</h3>
          <ul class="space-y-2.5 text-sm">
            <li v-for="link in links" :key="link.hash">
              <RouterLink
                :to="{ hash: link.hash }"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                to="/login"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </RouterLink>
            </li>
          </ul>
        </div>

        <div v-reveal="200" class="space-y-4">
          <h3 class="text-sm font-semibold">Contact us</h3>
          <ul class="space-y-3 text-sm">
            <li v-for="contact in contacts" :key="contact.label" class="flex items-start gap-3">
              <span
                class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
              >
                <component :is="contact.icon" class="size-4" />
              </span>
              <a
                v-if="contact.href"
                :href="contact.href"
                class="text-muted-foreground hover:text-foreground mt-1.5 break-all transition-colors"
              >
                {{ contact.label }}
              </a>
              <span v-else class="text-muted-foreground mt-1.5">{{ contact.label }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t">
        <div
          class="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs sm:flex-row sm:px-6"
        >
          <p>© {{ year }} Agusan Pequeño Elementary School. All rights reserved.</p>
          <p>Butuan City · Lesson Plan AI</p>
        </div>
      </div>
    </footer>
  </div>
</template>
=======
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
>>>>>>> eac4199a1d51e5693e9998e10c4381c43ee9545f
