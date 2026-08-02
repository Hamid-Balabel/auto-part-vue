import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  listBranches,
  setCurrentBranch as setCurrentBranchRequest,
} from '@/modules/inventory/api'
import type { Branch } from '@/modules/inventory/types'
import {
  fetchProfile,
  login as loginRequest,
  logout as logoutRequest,
} from '@/modules/auth/api'
import type { AuthUser, LoginPayload } from '@/modules/auth/types'
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '@/utils/token'

function normalizePermissions(value: unknown): string[] {
  return Array.isArray(value) &&
    value.every((item) => typeof item === 'string')
    ? value
    : []
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken())
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const branches = ref<Branch[]>([])
  const currentBranch = ref<Branch | null>(null)
  const branchesLoading = ref(false)
  const branchesLoaded = ref(false)
  const branchError = ref('')
  const branchPromptOpen = ref(false)
  const branchPromptSkipped = ref(false)
  const selectingCurrentBranch = ref(false)
  const branchRevision = ref(0)

  const isAuthenticated = computed(() => Boolean(token.value))
  const permissions = computed(() =>
    normalizePermissions(user.value?.permissions),
  )
  const canReadBranches = computed(() =>
    permissions.value.includes('read-branch'),
  )
  const canSetCurrentBranch = computed(() =>
    permissions.value.includes('set-current-branch'),
  )

  function resetBranchState() {
    branches.value = []
    currentBranch.value = null
    branchesLoaded.value = false
    branchesLoading.value = false
    branchError.value = ''
    branchPromptOpen.value = false
    branchPromptSkipped.value = false
    selectingCurrentBranch.value = false
    branchRevision.value = 0
  }

  async function refreshBranches(promptIfMissing = false): Promise<void> {
    if (!canReadBranches.value) {
      resetBranchState()
      return
    }

    branchesLoading.value = true
    branchError.value = ''
    try {
      const result = await listBranches({ per_page: -1, is_active: true })
      branches.value = Array.isArray(result) ? result : result.data
      currentBranch.value =
        branches.value.find((branch) => branch.is_current) ?? null
      branchesLoaded.value = true
      if (
        promptIfMissing &&
        canSetCurrentBranch.value &&
        !branchPromptSkipped.value
      )
        branchPromptOpen.value = true
      else branchPromptOpen.value = false
    } catch (error) {
      branchesLoaded.value = false
      throw error
    } finally {
      branchesLoading.value = false
    }
  }

  async function syncBranches(promptIfMissing = false) {
    try {
      await refreshBranches(promptIfMissing)
    } catch {
      branchPromptOpen.value = false
    }
  }

  function applyBranch(branch: Branch) {
    const previousCurrentId = currentBranch.value?.id ?? null
    const index = branches.value.findIndex((item) => item.id === branch.id)
    if (branch.is_current) {
      branches.value.forEach((item) => {
        item.is_current = item.id === branch.id
      })
      currentBranch.value = branch
    } else if (previousCurrentId === branch.id) {
      currentBranch.value = null
    }

    if (branch.is_active) {
      if (index >= 0) branches.value[index] = branch
      else branches.value.push(branch)
    } else if (index >= 0) branches.value.splice(index, 1)

    const nextCurrentId = currentBranch.value?.id ?? null
    if (previousCurrentId !== nextCurrentId) branchRevision.value += 1
  }

  function removeBranch(id: number) {
    branches.value = branches.value.filter((branch) => branch.id !== id)
    if (currentBranch.value?.id === id) {
      currentBranch.value = null
      branchRevision.value += 1
    }
  }

  async function selectCurrentBranch(id: number): Promise<Branch> {
    if (selectingCurrentBranch.value) {
      return currentBranch.value as Branch
    }
    selectingCurrentBranch.value = true
    branchError.value = ''
    try {
      const branch = await setCurrentBranchRequest(id)
      applyBranch(branch)
      branchPromptOpen.value = false
      branchPromptSkipped.value = false
      return branch
    } finally {
      selectingCurrentBranch.value = false
    }
  }

  function skipBranchPrompt() {
    branchPromptSkipped.value = true
    branchPromptOpen.value = false
  }

  function openBranchPrompt() {
    if (canReadBranches.value && canSetCurrentBranch.value)
      branchPromptOpen.value = true
  }

  async function login(payload: LoginPayload): Promise<void> {
    loading.value = true
    resetBranchState()
    try {
      const response = await loginRequest(payload)
      if (response.token) {
        token.value = response.token
        setStoredToken(response.token)
      }
      user.value = response.user
      initialized.value = true
      await syncBranches(true)
    } finally {
      loading.value = false
    }
  }

  async function loadProfile(): Promise<void> {
    if (!token.value) {
      initialized.value = true
      return
    }

    loading.value = true
    try {
      const response = await fetchProfile()
      user.value = response.user
      await syncBranches(false)
    } catch (error) {
      token.value = null
      user.value = null
      resetBranchState()
      clearStoredToken()
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) await logoutRequest()
    } finally {
      token.value = null
      user.value = null
      initialized.value = true
      resetBranchState()
      clearStoredToken()
    }
  }

  function logoutLocal(): void {
    token.value = null
    user.value = null
    initialized.value = true
    resetBranchState()
    clearStoredToken()
  }

  return {
    token,
    user,
    loading,
    initialized,
    isAuthenticated,
    permissions,
    branches,
    currentBranch,
    branchesLoading,
    branchesLoaded,
    branchError,
    branchPromptOpen,
    selectingCurrentBranch,
    branchRevision,
    canReadBranches,
    canSetCurrentBranch,
    refreshBranches,
    applyBranch,
    removeBranch,
    selectCurrentBranch,
    skipBranchPrompt,
    openBranchPrompt,
    login,
    loadProfile,
    logout,
    logoutLocal,
  }
})
