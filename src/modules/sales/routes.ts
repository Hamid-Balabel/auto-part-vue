import type { RouteRecordRaw } from 'vue-router'

export const salesRoutes: RouteRecordRaw[] = [
  {
    path: 'installments',
    name: 'installments.index',
    component: () => import('./pages/InstallmentsIndexPage.vue'),
    meta: { permission: ['view-all-installment', 'view-own-installment'] },
  },
  {
    path: 'installment-offsets',
    name: 'installment-offsets.index',
    component: () => import('./pages/InstallmentOffsetsPage.vue'),
    meta: { permission: ['view-all-installment-offset', 'view-own-installment-offset'] },
  },
  {
    path: 'purchases',
    name: 'purchases.index',
    component: () => import('./pages/PurchasesIndexPage.vue'),
    meta: { permission: ['view-all-purchase', 'view-own-purchase'], permissionAll: ['read-purchase'] },
  },
  {
    path: 'purchases/:id',
    name: 'purchases.show',
    component: () => import('./pages/PurchaseDetailsPage.vue'),
    props: true,
    meta: { permission: ['view-all-purchase', 'view-own-purchase'], permissionAll: ['read-purchase'], sidebarRoute: 'purchases.index' },
  },
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
