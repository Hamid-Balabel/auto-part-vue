import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission, type PermissionRequirement } from '@/utils/permissions'

export function usePermissions() {
  const auth = useAuthStore()
  const permissions = computed(() => auth.permissions)

  function can(required?: PermissionRequirement): boolean {
    return hasPermission(permissions.value, required)
  }

  return {
    permissions,
    can,
  }
}
