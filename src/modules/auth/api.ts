import { http, unwrapData } from '@/api/http'
import type { ApiEnvelope } from '@/types/api'
import type { LoginPayload, LoginResponse, ProfileResponse } from './types'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await http.post<ApiEnvelope<LoginResponse>>('/login', payload)

  return unwrapData(response)
}

export async function fetchProfile(): Promise<ProfileResponse> {
  const response = await http.get<ApiEnvelope<ProfileResponse>>('/me')

  return unwrapData(response)
}

export async function logout(payload?: { all_devices?: boolean; token_id?: number | string }): Promise<void> {
  await http.post('/logout', payload ?? {})
}
