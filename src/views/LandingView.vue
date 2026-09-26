<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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
    >
      <img
        :src="logoUrl"
        alt=""
        aria-hidden="true"
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
            </li>
          </ul>
        </div>
      </div>
    </section>

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
