import type { RouteLocationRaw } from 'vue-router'
import type { AuthUser } from '@/modules/auth/types'
import { hasPermission } from '@/utils/permissions'

export function isRootOrAdmin(user: AuthUser | null | undefined): boolean {
  return (
    user?.roles?.some((role) => {
      const name = typeof role === 'string' ? role : role.name
      return name.toLowerCase() === 'root' || name.toLowerCase() === 'admin'
    }) ?? false
  )
}

export function defaultAuthenticatedRoute(user: AuthUser | null | undefined): RouteLocationRaw {
  if (isRootOrAdmin(user)) return { name: 'dashboard' }
  const perms = Array.isArray(user?.permissions) ? user.permissions.filter((p): p is string => typeof p === 'string') : []
  if (hasPermission(perms, 'create-order')) return { name: 'orders.quick-sale' }
  return { name: 'forbidden' }
}
