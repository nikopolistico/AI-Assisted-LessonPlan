<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import LogoMark from '@/components/app/LogoMark.vue'
import { useAuthStore } from '@/stores/auth'
import { homeFor } from '@/router'

const auth = useAuthStore()
</script>

<template>
  <div class="grid min-h-screen place-items-center px-4">
    <div class="flex max-w-md flex-col items-center gap-4 text-center">
      <LogoMark class="size-11" />
      <div class="space-y-1">
        <p class="text-muted-foreground text-sm font-medium">404</p>
        <h1 class="text-2xl font-semibold tracking-tight">That page does not exist</h1>
        <p class="text-muted-foreground text-sm">
          The link may be out of date, or the page belongs to a different role.
        </p>
      </div>
      <Button as-child>
        <RouterLink :to="homeFor(auth.role)">Go back</RouterLink>
      </Button>
    </div>
  </div>
</template>
