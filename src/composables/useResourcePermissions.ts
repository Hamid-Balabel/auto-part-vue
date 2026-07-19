import { computed } from 'vue'
import { usePermissions } from './usePermissions'

export function useResourcePermissions(resource: string) {
  const { can } = usePermissions()

  return {
    canView: computed(() => can([`view-all-${resource}`, `view-own-${resource}`, `read-${resource}`])),
    canCreate: computed(() => can(`create-${resource}`)),
    canUpdate: computed(() => can(`update-${resource}`)),
    canDelete: computed(() => can(`delete-${resource}`)),
    canRestore: computed(() => can(`restore-${resource}`)),
    canForceDelete: computed(() => can(`force-delete-${resource}`)),
    canToggle: computed(() => can(`toggle-active-${resource}`)),
  }
}
