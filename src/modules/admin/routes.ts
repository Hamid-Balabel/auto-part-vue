import type { RouteRecordRaw } from 'vue-router'

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: 'users',
    name: 'users.index',
    component: () => import('./pages/UsersIndexPage.vue'),
    meta: { permission: ['view-all-user', 'view-own-user'] },
  },
  {
    path: 'users/create',
    name: 'users.create',
    component: () => import('./pages/UserFormPage.vue'),
    meta: { permission: 'create-user' },
  },
  {
    path: 'users/:id/edit',
    name: 'users.edit',
    component: () => import('./pages/UserFormPage.vue'),
    props: true,
    meta: { permission: 'update-user' },
  },
  {
    path: 'roles',
    name: 'roles.index',
    component: () => import('./pages/RolesIndexPage.vue'),
    meta: { permission: ['view-all-role', 'view-own-role'] },
  },
  {
    path: 'roles/create',
    name: 'roles.create',
    component: () => import('./pages/RoleFormPage.vue'),
    meta: { permission: 'create-role' },
  },
  {
    path: 'roles/:id/edit',
    name: 'roles.edit',
    component: () => import('./pages/RoleFormPage.vue'),
    props: true,
    meta: { permission: 'update-role' },
  },
  {
    path: 'permissions',
    name: 'permissions.index',
    component: () => import('./pages/PermissionsIndexPage.vue'),
    meta: { permission: 'read-permission' },
  },
  {
    path: 'settings',
    name: 'settings.index',
    component: () => import('./pages/SettingsPage.vue'),
    meta: { permission: 'update-setting' },
  },
]
