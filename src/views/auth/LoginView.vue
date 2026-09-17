<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import logoUrl from '@/assets/images/logo.png'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { homeFor } from '@/router'
import { EMAIL_MAX, PASSWORD_MAX, validateEmail, validatePassword } from '@/lib/validators'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const showPassword = ref(false)

const email = ref('')
const password = ref('')

// --- Validation ---------------------------------------------------------------
// Hard caps also sit on the inputs as `maxlength`; the checks live in lib/validators.
const errors = reactive({ email: '', password: '' })
const showErrors = ref(false)

const checkEmail = () => validateEmail(email.value)
const checkPassword = () => validatePassword(password.value, false)

const signinValid = computed(() => !checkEmail() && !checkPassword())

// --- Actions -----------------------------------------------------------------
async function submit() {
  showErrors.value = true
  errors.email = checkEmail()
  errors.password = checkPassword()
  if (errors.email || errors.password) return

  const user = await auth.login(email.value.trim(), password.value)
  if (!user) return
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  router.push(redirect ?? homeFor(user.role))
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Brand panel — desktop only. The form panel carries its own compact -->
    <!-- lockup on mobile instead of squeezing this in above the fold. -->
    <div
      class="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
      style="background: radial-gradient(circle at 25% 15%, #45598b 0%, #1c2d52 75%)"
    >
      <img
        :src="logoUrl"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -right-28 -bottom-28 size-[30rem] max-w-none opacity-[0.06] select-none"
      />

      <div class="relative flex items-center gap-3">
        <img
          :src="logoUrl"
          alt="Agusan Pequeño Elementary School"
          class="size-10 shrink-0 rounded-xl bg-gradient-to-br from-[#45598b] to-(--brand-navy) object-contain p-1 ring-1 ring-black/10"
        />
        <div class="min-w-0">
          <p class="text-sm font-semibold tracking-tight">Lesson Plan AI</p>
          <p class="truncate text-xs text-white/60">Agusan Pequeño Elementary School</p>
        </div>
      </div>

      <div class="relative max-w-md space-y-3">
        <h1 class="text-3xl font-semibold text-balance">
          Mathematics lesson plans, drafted in the time it takes to make coffee.
        </h1>
        <p class="text-sm text-white/60">
          Built for DepEd teachers and administrators at Agusan Pequeño Elementary School, Butuan
          City.
        </p>
      </div>

      <p class="relative text-xs text-white/40">
        © {{ new Date().getFullYear() }} Agusan Pequeño Elementary School
      </p>
    </div>

    <!-- Form panel -->
    <div class="bg-background flex items-center justify-center px-4 py-10 sm:px-6 lg:py-16">
      <div class="w-full max-w-sm space-y-6">
        <!-- Compact brand lockup — mobile only. -->
        <div class="flex flex-col items-center gap-3 text-center lg:hidden">
          <img
            :src="logoUrl"
            alt="Agusan Pequeño Elementary School"
            class="size-14 rounded-2xl bg-gradient-to-br from-white via-[#fffaf0] to-[#fff0be] object-contain p-1 shadow-sm ring-1 ring-black/5"
          />
          <div class="space-y-0.5">
            <p class="text-lg font-semibold tracking-tight">Lesson Plan AI</p>
            <p class="text-muted-foreground text-xs">
              Agusan Pequeño Elementary School · Butuan City
            </p>
          </div>
        </div>

        <div class="space-y-1">
          <h2 class="text-xl font-semibold tracking-tight">Welcome back</h2>
          <p class="text-muted-foreground text-sm">
            Use your DepEd-issued account to access the system. New teacher accounts are created by
            an administrator.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="submit" novalidate>
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="username"
              spellcheck="false"
              :maxlength="EMAIL_MAX"
              :aria-invalid="Boolean(errors.email) || undefined"
              placeholder="name@school.com"
            />
            <p v-if="errors.email" class="text-destructive text-xs">{{ errors.email }}</p>
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :maxlength="PASSWORD_MAX"
                :aria-invalid="Boolean(errors.password) || undefined"
                class="pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
            <p v-if="errors.password" class="text-destructive text-xs">{{ errors.password }}</p>
          </div>

          <Alert v-if="auth.error" variant="destructive">
            <AlertCircle />
            <AlertDescription>{{ auth.error }}</AlertDescription>
          </Alert>

          <Button
            type="submit"
            class="w-full"
            :disabled="auth.pending || (showErrors && !signinValid)"
          >
            <Loader2 v-if="auth.pending" class="animate-spin" />
            {{ auth.pending ? 'Signing in…' : 'Sign in' }}
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
