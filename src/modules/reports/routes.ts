import type { RouteRecordRaw } from 'vue-router'

export const reportRoutes: RouteRecordRaw[] = [
  {
    path: 'reports',
    name: 'reports.index',
    component: () => import('./pages/ReportsPage.vue'),
    meta: { permission: ['read-report', 'view-report', 'export-report'] },
  },
]
