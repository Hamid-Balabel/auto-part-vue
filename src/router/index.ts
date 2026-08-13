import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { adminRoutes } from '@/modules/admin/routes'
import { dataEntryRoutes } from '@/modules/data-entry/routes'
import { inventoryRoutes } from '@/modules/inventory/routes'
import { salesRoutes } from '@/modules/sales/routes'
import { reportRoutes } from '@/modules/reports/routes'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/permissions'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
      },
      ...dataEntryRoutes,
      ...inventoryRoutes,
      ...salesRoutes,
      ...reportRoutes,
      ...adminRoutes,
      {
        path: 'modules/:module',
        name: 'module-placeholder',
        component: () => import('@/modules/system/pages/ModulePlaceholderPage.vue'),
        props: true,
      },
      {
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('@/modules/system/pages/ForbiddenPage.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.loadProfile()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  const requiredPermission = to.meta.permission as string | string[] | undefined
  const requiredAllPermissions = to.meta.permissionAll as string[] | undefined

  if (!hasPermission(auth.permissions, requiredPermission) || requiredAllPermissions?.some((permission) => !hasPermission(auth.permissions, permission))) {
    return { name: 'forbidden' }
  }

  return true
})

window.addEventListener('auth:unauthorized', () => {
  const auth = useAuthStore()
  auth.logoutLocal()
  void router.push({ name: 'login' })
})

window.addEventListener('auth:forbidden', () => {
  void router.push({ name: 'forbidden' })
})
