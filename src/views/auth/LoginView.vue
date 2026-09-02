<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, GraduationCap, Loader2, ShieldCheck, Sparkles } from 'lucide-vue-next'
import LogoMark from '@/components/app/LogoMark.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DEMO_PASSWORD, useAuthStore } from '@/stores/auth'
import { homeFor } from '@/router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

const demoAccounts = [
  {
    role: 'Teacher',
    email: 'teacher@lessonplan.ph',
    blurb: 'Input lesson details, generate, edit and save plans.',
    icon: GraduationCap,
  },
  {
    role: 'Admin',
    email: 'admin@lessonplan.ph',
    blurb: 'Manage accounts, MELC data, templates and reports.',
    icon: ShieldCheck,
  },
]

async function submit() {
  const user = await auth.login(email.value, password.value)
  if (!user) return
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  router.push(redirect ?? homeFor(user.role))
}

function useAccount(accountEmail: string) {
  email.value = accountEmail
  password.value = DEMO_PASSWORD
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Brand panel -->
    <div
      class="bg-primary text-primary-foreground relative hidden flex-col justify-between p-10 lg:flex"
    >
      <div class="flex items-center gap-2.5">
        <LogoMark class="bg-primary-foreground/15 text-primary-foreground" />
        <span class="font-semibold">Lesson Plan AI</span>
      </div>

      <div class="max-w-md space-y-6">
        <h1 class="text-3xl leading-tight font-semibold tracking-tight">
          Mathematics lesson plans, drafted in the time it takes to make coffee.
        </h1>
        <p class="text-primary-foreground/75 text-sm leading-relaxed">
          Enter the topic, the MELC, the grade level and how long the period runs. The system
          returns a complete plan that follows your division's template — ready to review, edit and
          print.
        </p>
        <ul class="space-y-3 text-sm">
          <li
            v-for="line in [
              'Aligned to the DepEd Most Essential Learning Competencies',
              'Templates maintained centrally by your administrator',
              'Every plan stays editable — the draft is a starting point',
            ]"
            :key="line"
            class="flex items-start gap-2.5"
          >
            <Sparkles class="mt-0.5 size-4 shrink-0 opacity-80" />
            <span class="text-primary-foreground/85">{{ line }}</span>
          </li>
        </ul>
      </div>

      <p class="text-primary-foreground/60 text-xs">Capstone prototype · Department of Education</p>
    </div>

    <!-- Form panel -->
    <div class="flex items-center justify-center px-4 py-12 sm:px-8">
      <div class="w-full max-w-sm space-y-6">
        <div class="flex flex-col items-center gap-3 text-center lg:hidden">
          <LogoMark class="size-11" />
          <span class="text-lg font-semibold">Lesson Plan AI</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Sign in</CardTitle>
            <CardDescription>Use your DepEd-issued account to access the system.</CardDescription>
          </CardHeader>

          <CardContent>
            <form class="space-y-4" @submit.prevent="submit">
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="username"
                  placeholder="name@lessonplan.ph"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input
                  id="password"
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Alert v-if="auth.error" variant="destructive">
                <AlertCircle />
                <AlertDescription>{{ auth.error }}</AlertDescription>
              </Alert>

              <Button type="submit" class="w-full" :disabled="auth.pending">
                <Loader2 v-if="auth.pending" class="animate-spin" />
                {{ auth.pending ? 'Signing in…' : 'Sign in' }}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <Separator class="flex-1" />
            <span class="text-muted-foreground text-xs whitespace-nowrap">Demo accounts</span>
            <Separator class="flex-1" />
          </div>

          <div class="grid gap-2">
            <button
              v-for="account in demoAccounts"
              :key="account.email"
              type="button"
              class="hover:bg-accent focus-visible:ring-ring/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
              @click="useAccount(account.email)"
            >
              <div
                class="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-md"
              >
                <component :is="account.icon" class="size-4" />
              </div>
              <div class="min-w-0 space-y-0.5">
                <p class="text-sm font-medium">{{ account.role }}</p>
                <p class="text-muted-foreground truncate text-xs">{{ account.email }}</p>
                <p class="text-muted-foreground text-xs">{{ account.blurb }}</p>
              </div>
            </button>
          </div>

          <p class="text-muted-foreground text-center text-xs">
            Password for every demo account: <code class="font-medium">{{ DEMO_PASSWORD }}</code>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
