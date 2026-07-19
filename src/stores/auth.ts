import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchProfile, login as loginRequest, logout as logoutRequest } from '@/modules/auth/api'
import type { AuthUser, LoginPayload } from '@/modules/auth/types'
import { clearStoredToken, getStoredToken, setStoredToken } from '@/utils/token'

function normalizePermissions(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : []
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken())
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const permissions = computed(() => normalizePermissions(user.value?.permissions))

  async function login(payload: LoginPayload): Promise<void> {
    loading.value = true

    try {
      const response = await loginRequest(payload)

      if (response.token) {
        token.value = response.token
        setStoredToken(response.token)
      }

      user.value = response.user
      initialized.value = true
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
    } catch (error) {
      token.value = null
      user.value = null
      clearStoredToken()
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) {
        await logoutRequest()
      }
    } finally {
      token.value = null
      user.value = null
      initialized.value = true
      clearStoredToken()
    }
  }

  function logoutLocal(): void {
    token.value = null
    user.value = null
    initialized.value = true
    clearStoredToken()
  }

  return {
    token,
    user,
    loading,
    initialized,
    isAuthenticated,
    permissions,
    login,
    loadProfile,
    logout,
    logoutLocal,
  }
})
