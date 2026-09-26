import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '@/types'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Reachable without a session. */
    public?: boolean
    /** Restricts the route to a single actor. */
    role?: Role
    title?: string
  }
}

export const homeFor = (role: Role | null) =>
  role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/login'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // In-page anchors (the landing page nav) glide to their section; the sticky
  // header's height is left clear via `scroll-mt-*` on each section.
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { public: true, title: 'Welcome' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true, title: 'Sign in' },
    },

    {
      path: '/teacher',
      component: () => import('@/layouts/TeacherLayout.vue'),
      meta: { role: 'teacher' },
      children: [
        {
          path: '',
          name: 'teacher-dashboard',
          component: () => import('@/views/teacher/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'generate',
          name: 'teacher-generate',
          component: () => import('@/views/teacher/GenerateView.vue'),
          meta: { title: 'Generate lesson plan' },
        },
        {
          path: 'plans',
          name: 'teacher-plans',
          component: () => import('@/views/teacher/PlanListView.vue'),
          meta: { title: 'My lesson plans' },
        },
        {
          path: 'plans/:id',
          name: 'teacher-plan',
          component: () => import('@/views/teacher/PlanDetailView.vue'),
          meta: { title: 'Lesson plan' },
        },
      ],
    },

    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { role: 'admin' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/UsersView.vue'),
          meta: { title: 'User accounts' },
        },
        {
          path: 'competencies',
          name: 'admin-competencies',
          component: () => import('@/views/admin/CompetenciesView.vue'),
          meta: { title: 'Math competencies' },
        },
        {
          path: 'templates',
          name: 'admin-templates',
          component: () => import('@/views/admin/TemplatesView.vue'),
          meta: { title: 'Lesson templates' },
        },
        {
          path: 'reports',
          name: 'admin-reports',
          component: () => import('@/views/admin/ReportsView.vue'),
          meta: { title: 'System reports' },
        },
      ],
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { public: true, title: 'Not found' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Hold the first navigation until the Supabase session has been restored.
  await auth.ensureReady()

  if (to.meta.public) {
    // A signed-in user opening the landing page or /login goes straight to their own workspace.
    if ((to.name === 'landing' || to.name === 'login') && auth.isAuthenticated) {
      return homeFor(auth.role)
    }
    return true
  }

  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.role && to.meta.role !== auth.role) return homeFor(auth.role)
  return true
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? `${title} · Lesson Plan AI` : 'Lesson Plan AI'
})

export default router
