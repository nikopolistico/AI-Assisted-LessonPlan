<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import logoUrl from '@/assets/images/logo.png'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth'
import { homeFor } from '@/router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = ref<'signin' | 'signup'>('signin')
const notice = ref('')
const showPassword = ref(false)

const email = ref('')
const password = ref('')
const fullName = ref('')
const school = ref('Agusan Pequeño Elementary School')

// --- Validation ---------------------------------------------------------------
// Hard caps also sit on the inputs as `maxlength`; these are the friendly checks.
const EMAIL_MAX = 254
const NAME_MAX = 80
const SCHOOL_MAX = 120
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72 // Supabase/bcrypt ceiling.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const HAS_DIGIT = /\d/
const HAS_LETTER = /[A-Za-z]/
// Letters (incl. accented), spaces, apostrophes, hyphens and dots — no digits.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u

const errors = reactive({ email: '', password: '', fullName: '', school: '' })
const showErrors = ref(false)

function checkEmail() {
  const v = email.value.trim()
  if (!v) return 'Enter your email address.'
  if (v.length > EMAIL_MAX) return `Email must be at most ${EMAIL_MAX} characters.`
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address, e.g. name@school.com.'
  return ''
}

function checkPassword(forSignup: boolean) {
  const v = password.value
  if (!v) return 'Enter your password.'
  if (v.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`
  if (!forSignup) return ''
  if (v.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  if (!HAS_LETTER.test(v) || !HAS_DIGIT.test(v)) {
    return 'Password must include both letters and numbers.'
  }
  return ''
}

function checkFullName() {
  const v = fullName.value.trim()
  if (!v) return 'Enter your full name.'
  if (v.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`
  if (HAS_DIGIT.test(v)) return 'Name should not contain numbers.'
  if (!NAME_RE.test(v)) return 'Use letters only, e.g. Maria Santos.'
  return ''
}

function checkSchool() {
  const v = school.value.trim()
  if (!v) return 'Enter your school or office.'
  if (v.length > SCHOOL_MAX) return `This must be at most ${SCHOOL_MAX} characters.`
  return ''
}

// Re-validate a field as the user fixes it, but only once they've tried to submit.
watch([email, password, fullName, school, mode], () => {
  if (!showErrors.value) return
  errors.email = checkEmail()
  errors.password = checkPassword(mode.value === 'signup')
  errors.fullName = mode.value === 'signup' ? checkFullName() : ''
  errors.school = mode.value === 'signup' ? checkSchool() : ''
})

const signinValid = computed(() => !checkEmail() && !checkPassword(false))
const signupValid = computed(
  () => !checkEmail() && !checkPassword(true) && !checkFullName() && !checkSchool(),
)

function switchMode(next: string | number) {
  mode.value = next === 'signup' ? 'signup' : 'signin'
  auth.error = ''
  notice.value = ''
  showErrors.value = false
  errors.email = errors.password = errors.fullName = errors.school = ''
}

// --- Actions -----------------------------------------------------------------
async function submit() {
  notice.value = ''
  showErrors.value = true
  errors.email = checkEmail()
  errors.password = checkPassword(false)
  if (errors.email || errors.password) return

  const user = await auth.login(email.value.trim(), password.value)
  if (!user) return
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  router.push(redirect ?? homeFor(user.role))
}

async function register() {
  notice.value = ''
  showErrors.value = true
  errors.email = checkEmail()
  errors.password = checkPassword(true)
  errors.fullName = checkFullName()
  errors.school = checkSchool()
  if (errors.email || errors.password || errors.fullName || errors.school) return

  const ok = await auth.signUp({
    fullName: fullName.value.trim(),
    email: email.value.trim(),
    school: school.value.trim(),
    password: password.value,
  })
  if (!ok) return

  // "Confirm email" off: sign-up logs the teacher straight in.
  if (auth.isAuthenticated) {
    router.push(homeFor(auth.role))
    return
  }

  password.value = ''
  mode.value = 'signin'
  notice.value = 'Account created. Check your email for the confirmation link, then sign in.'
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Brand panel — desktop only. The form panel carries its own compact -->
    <!-- lockup on mobile instead of squeezing this in above the fold. -->
    <div
      class="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
      style="
        background: radial-gradient(
          circle at 25% 15%,
          oklch(0.34 0.14 262) 0%,
          oklch(0.15 0.08 262) 75%
        );
      "
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
          class="size-10 shrink-0 rounded-xl bg-gradient-to from-dark-200 to-slate-400 object-contain p-1 ring-1 ring-black/10"
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
            class="size-14 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-200 object-contain p-1 shadow-sm ring-1 ring-black/5"
          />
          <div class="space-y-0.5">
            <p class="text-lg font-semibold tracking-tight">Lesson Plan AI</p>
            <p class="text-muted-foreground text-xs">
              Agusan Pequeño Elementary School · Butuan City
            </p>
          </div>
        </div>

        <Tabs :model-value="mode" @update:model-value="switchMode">
          <TabsList class="w-full">
            <TabsTrigger value="signin" class="flex-1">Sign in</TabsTrigger>
            <TabsTrigger value="signup" class="flex-1">Create account</TabsTrigger>
          </TabsList>
        </Tabs>

        <div class="space-y-1">
          <h2 class="text-xl font-semibold tracking-tight">
            {{ mode === 'signin' ? 'Welcome back' : 'Create an account' }}
          </h2>
          <p class="text-muted-foreground text-sm">
            {{
              mode === 'signin'
                ? 'Use your DepEd-issued account to access the system.'
                : 'New accounts start as a teacher and can be used right away.'
            }}
          </p>
        </div>

        <Alert v-if="notice" variant="success">
          <CheckCircle2 />
          <AlertDescription>{{ notice }}</AlertDescription>
        </Alert>

        <Transition
          mode="out-in"
          enter-active-class="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
          leave-active-class="animate-out fade-out-0 slide-out-to-top-1 duration-150"
        >
          <form
            v-if="mode === 'signin'"
            key="signin"
            class="space-y-4"
            @submit.prevent="submit"
            novalidate
          >
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

          <form v-else key="signup" class="space-y-4" @submit.prevent="register" novalidate>
            <div class="space-y-2">
              <Label for="full-name">Full name</Label>
              <Input
                id="full-name"
                v-model="fullName"
                autocomplete="name"
                :maxlength="NAME_MAX"
                :aria-invalid="Boolean(errors.fullName) || undefined"
                placeholder="Maria Santos"
              />
              <p v-if="errors.fullName" class="text-destructive text-xs">{{ errors.fullName }}</p>
            </div>

            <div class="space-y-2">
              <Label for="school">School / office</Label>
              <Input
                id="school"
                v-model="school"
                :maxlength="SCHOOL_MAX"
                :aria-invalid="Boolean(errors.school) || undefined"
                placeholder="Agusan Pequeño Elementary School"
              />
              <p v-if="errors.school" class="text-destructive text-xs">{{ errors.school }}</p>
            </div>

            <div class="space-y-2">
              <Label for="signup-email">Email</Label>
              <Input
                id="signup-email"
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                spellcheck="false"
                :maxlength="EMAIL_MAX"
                :aria-invalid="Boolean(errors.email) || undefined"
                placeholder="name@school.com"
              />
              <p v-if="errors.email" class="text-destructive text-xs">{{ errors.email }}</p>
            </div>

            <div class="space-y-2">
              <Label for="signup-password">Password</Label>
              <div class="relative">
                <Input
                  id="signup-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :minlength="PASSWORD_MIN"
                  :maxlength="PASSWORD_MAX"
                  :aria-invalid="Boolean(errors.password) || undefined"
                  class="pr-10"
                  placeholder="At least 8 characters, with a number"
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
              <p v-else class="text-muted-foreground text-xs">
                8–{{ PASSWORD_MAX }} characters, mixing letters and numbers.
              </p>
            </div>

            <Alert v-if="auth.error" variant="destructive">
              <AlertCircle />
              <AlertDescription>{{ auth.error }}</AlertDescription>
            </Alert>

            <Button
              type="submit"
              class="w-full"
              :disabled="auth.pending || (showErrors && !signupValid)"
            >
              <Loader2 v-if="auth.pending" class="animate-spin" />
              {{ auth.pending ? 'Creating account…' : 'Create account' }}
            </Button>
          </form>
        </Transition>
      </div>
    </div>
  </div>
</template>
