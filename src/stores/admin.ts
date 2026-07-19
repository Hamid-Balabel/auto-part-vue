import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listCountries } from '@/modules/data-entry/api'
import type { Country } from '@/modules/data-entry/types'
import { listPermissions } from '@/modules/admin/api'
import type { Permission } from '@/modules/admin/types'

let permissionsRequest: Promise<void> | null = null
let countriesRequest: Promise<void> | null = null

export const useAdminStore = defineStore('admin', () => {
  const permissions = ref<Permission[]>([])
  const permissionsLoaded = ref(false)
  const permissionsLoading = ref(false)
  const countries = ref<Country[]>([])
  const countriesLoaded = ref(false)
  const countriesLoading = ref(false)
  const countriesError = ref('')

  async function loadPermissions(force = false): Promise<void> {
    if (permissionsLoaded.value && !force) return
    if (permissionsRequest && !force) return permissionsRequest

    permissionsLoading.value = true
    permissionsRequest = listPermissions({ per_page: -1 })
      .then((response) => {
        permissions.value = Array.isArray(response) ? response : response.data
        permissionsLoaded.value = true
      })
      .finally(() => {
        permissionsLoading.value = false
        permissionsRequest = null
      })

    return permissionsRequest
  }

  async function loadCountries(force = false): Promise<void> {
    if (countriesLoaded.value && !force) return
    if (countriesRequest && !force) return countriesRequest

    countriesLoading.value = true
    countriesError.value = ''
    countriesRequest = listCountries({ per_page: -1 })
      .then((response) => {
        countries.value = Array.isArray(response) ? response : response.data
        countriesLoaded.value = true
      })
      .catch((error) => {
        countriesError.value = error instanceof Error ? error.message : 'Unable to load countries.'
        throw error
      })
      .finally(() => {
        countriesLoading.value = false
        countriesRequest = null
      })

    return countriesRequest
  }

  return {
    permissions,
    permissionsLoaded,
    permissionsLoading,
    countries,
    countriesLoaded,
    countriesLoading,
    countriesError,
    loadPermissions,
    loadCountries,
  }
})
