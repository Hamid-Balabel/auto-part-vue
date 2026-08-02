import type { RouteRecordRaw } from 'vue-router'

export const salesRoutes: RouteRecordRaw[] = [
  {
    path: 'orders',
    name: 'orders.index',
    component: () => import('./pages/OrdersIndexPage.vue'),
    meta: { permission: ['view-all-order', 'view-own-order'] },
  },
  {
    path: 'orders/quick-sale',
    name: 'orders.quick-sale',
    component: () => import('./pages/QuickSalePage.vue'),
    meta: { permission: 'create-order' },
  },
  {
    path: 'orders/:id/edit',
    name: 'orders.edit',
    component: () => import('./pages/QuickSalePage.vue'),
    props: true,
    meta: { permission: 'update-order' },
  },
  {
    path: 'orders/:id',
    name: 'orders.show',
    component: () => import('./pages/OrderDetailsPage.vue'),
    props: true,
    meta: { permission: ['view-all-order', 'view-own-order'] },
  },
]
