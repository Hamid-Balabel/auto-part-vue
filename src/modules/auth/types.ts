export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  roles?: unknown
  permissions?: unknown
}

export interface LoginPayload {
  email: string
  password: string
  meta?: Record<string, unknown>
}

export interface LoginResponse {
  token: string | null
  user: AuthUser
}

export interface SessionInfo {
  id: number | string
  ip_address?: string | null
  user_agent?: string | null
  last_used_at?: string | null
  created_at?: string | null
  device?: string | null
  platform?: string | null
  timezone?: string | null
  language?: string | null
  screen?: string | null
}

export interface ProfileResponse {
  sessions: SessionInfo[]
  user: AuthUser
}
