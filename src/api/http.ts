import axios, { AxiosError } from 'axios'
import { getStoredLocale } from '@/plugins/i18n'
import { clearStoredToken, getStoredToken } from '@/utils/token'
import type { ApiErrorPayload } from '@/types/api'

export class ApiError extends Error {
  statusCode?: number
  errors?: Record<string, string[]>

  constructor(message: string, statusCode?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://auto-part.test/api',
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getStoredToken()
  config.headers['Accept-Language'] = getStoredLocale()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const statusCode = error.response?.status
    const payload = error.response?.data
    const message = payload?.message ?? 'Something went wrong. Please try again.'

    if (statusCode === 401) {
      clearStoredToken()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    if (statusCode === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: message }))
    }

    return Promise.reject(new ApiError(message, statusCode, payload?.errors))
  },
)

export function unwrapData<T>(response: { data: { data?: T } | T }): T {
  const payload = response.data as { data?: T } | T
  return typeof payload === 'object' && payload !== null && 'data' in payload
    ? (payload as { data: T }).data
    : (payload as T)
}
