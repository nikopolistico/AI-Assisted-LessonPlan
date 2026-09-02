<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from 'lucide-vue-next'
import LogoMark from './LogoMark.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth'
import { initials } from '@/lib/format'
import { loadState, saveState } from '@/lib/persist'
import { useTheme } from '@/composables/useTheme'
import type { NavItem } from './nav'

const props = defineProps<{ nav: NavItem[]; workspace: string }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { isDark, toggle } = useTheme()

const mobileOpen = ref(false)
watch(
  () => route.fullPath,
  () => (mobileOpen.value = false),
)

// Desktop sidebar state is remembered; the mobile drawer always reopens closed.
const collapsed = ref(loadState('alp.sidebar-collapsed', false))
watch(collapsed, (value) => saveState('alp.sidebar-collapsed', value))

function isActive(item: NavItem) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

function signOut() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="bg-background min-h-screen">
    <!-- Sidebar -->
    <aside
      class="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-[width,transform] duration-200 lg:translate-x-0"
      :class="[
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'lg:w-16' : 'lg:w-64',
      ]"
    >
      <div
        class="flex h-16 items-center gap-2.5 px-4"
        :class="collapsed && 'lg:justify-center lg:px-0'"
      >
        <LogoMark :class="collapsed && 'lg:hidden'" />
        <div class="min-w-0" :class="collapsed && 'lg:hidden'">
          <p class="truncate text-sm font-semibold">Lesson Plan AI</p>
          <p class="text-muted-foreground truncate text-xs">{{ props.workspace }}</p>
        </div>

        <!-- Mobile: the drawer covers the header, so it closes itself. -->
        <Button
          variant="ghost"
          size="icon-sm"
          class="ml-auto lg:hidden"
          @click="mobileOpen = false"
        >
          <X />
          <span class="sr-only">Close menu</span>
        </Button>

        <!-- Desktop: collapses the sidebar to an icon-only rail, and back. -->
        <Button
          variant="ghost"
          size="icon-sm"
          class="hidden lg:inline-flex"
          :class="!collapsed && 'lg:ml-auto'"
          :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="collapsed = !collapsed"
        >
          <PanelLeftOpen v-if="collapsed" />
          <PanelLeftClose v-else />
          <span class="sr-only">{{ collapsed ? 'Expand sidebar' : 'Collapse sidebar' }}</span>
        </Button>
      </div>

      <Separator />

      <nav class="flex-1 space-y-1 overflow-y-auto p-3" :class="collapsed && 'lg:px-2'">
        <RouterLink
          v-for="item in props.nav"
          :key="item.to"
          :to="item.to"
          :title="collapsed ? item.label : undefined"
          class="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          :class="[
            isActive(item)
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'lg:justify-center lg:px-0',
          ]"
        >
          <component :is="item.icon" class="size-4 shrink-0" />
          <span class="truncate" :class="collapsed && 'lg:hidden'">{{ item.label }}</span>

          <Badge
            v-if="item.badge"
            :variant="isActive(item) ? 'secondary' : 'warning'"
            class="ml-auto tabular-nums"
            :class="collapsed && 'lg:hidden'"
          >
            {{ item.badge }}
          </Badge>
          <!-- The count has no room on the rail, so it becomes a dot. -->
          <span
            v-if="item.badge && collapsed"
            class="bg-primary absolute top-1 right-1 hidden size-1.5 rounded-full lg:block"
          />
        </RouterLink>
      </nav>

      <div class="p-3" :class="collapsed && 'lg:hidden'">
        <div class="bg-muted/60 rounded-lg p-3">
          <p class="text-xs font-medium">Prototype data</p>
          <p class="text-muted-foreground mt-1 text-xs leading-relaxed">
            Everything you change is stored in this browser only.
          </p>
        </div>
      </div>
    </aside>

    <!-- Scrim -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="mobileOpen = false"
    />

    <!-- Main -->
    <div class="transition-[padding] duration-200" :class="collapsed ? 'lg:pl-16' : 'lg:pl-64'">
      <header
        class="bg-background/85 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6 no-print"
      >
        <Button variant="ghost" size="icon-sm" class="lg:hidden" @click="mobileOpen = true">
          <Menu />
          <span class="sr-only">Open menu</span>
        </Button>

        <p class="truncate text-sm font-medium">{{ route.meta.title ?? props.workspace }}</p>

        <div class="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            :title="isDark ? 'Switch to light' : 'Switch to dark'"
            @click="toggle"
          >
            <Sun v-if="isDark" />
            <Moon v-else />
            <span class="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                class="hover:bg-accent focus-visible:ring-ring/50 flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 pl-1 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <Avatar class="size-7">
                  <AvatarFallback class="bg-primary/10 text-primary">
                    {{ initials(auth.currentUser?.name ?? '?') }}
                  </AvatarFallback>
                </Avatar>
                <span class="hidden text-sm font-medium sm:inline">{{
                  auth.currentUser?.name
                }}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-60">
              <DropdownMenuLabel class="font-normal">
                <p class="text-sm font-medium">{{ auth.currentUser?.name }}</p>
                <p class="text-muted-foreground truncate text-xs">{{ auth.currentUser?.email }}</p>
                <Badge variant="secondary" class="mt-2 capitalize">{{
                  auth.currentUser?.role
                }}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="signOut">
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
