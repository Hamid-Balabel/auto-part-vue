export type { TranslationMap } from '@/modules/data-entry/types'
import type { TranslationMap } from '@/modules/data-entry/types'

export interface Permission {
  id: number
  name: string
  translation_display_name?: string | null
  display_name?: TranslationMap
  group?: string | null
  display_group?: string | null
}

export interface Role {
  id: number
  name: string
  translation_display_name?: string | null
  display_name?: TranslationMap
  permissions?: Permission[]
  is_active?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface UserPhone {
  phone?: string | null
  phone_code?: string | null
  phone_code_id?: number | null
}

export interface User {
  id: number
  name: string
  email: string
  phone?: UserPhone
  gender?: string | null
  display_gender?: string | null
  is_active?: boolean
  avatar?: string | null
  roles?: Array<{ id: number; name?: string; translation_display_name?: string | null; display_name?: string | null }>
  created_at?: string | null
  updated_at?: string | null
}

export interface UserPayload {
  name: string
  email: string
  phone?: string | null
  phone_code_id?: string | number | null
  password?: string
  password_confirmation?: string
  gender: string
  roles: number[]
  permissions?: Array<string | number>
  is_active: boolean
  avatar?: File | null
}

export interface RolePayload {
  name: string
  display_name: TranslationMap
  permissions: string[]
}

export interface SettingItem {
  id: number
  key: string
  value: unknown
  translated_value?: unknown
  label?: TranslationMap
  translated_label?: string | null
  placeholder?: TranslationMap
  translated_placeholder?: string | null
  group: string
  display_group?: string | null
  type?: string | null
  display_type?: string | null
  is_env?: number
  is_multi_lang?: number
  last_updated_at?: string | null
}

export interface SettingGroup {
  label: string
  display_label?: string | null
  nested?: SettingGroup[] | null
  items?: SettingItem[] | null
}

export type SettingValue = string | number | boolean | null | File | string[] | TranslationMap | Record<string, unknown> | unknown[]

export interface SettingUpdateItem {
  key: string
  group: string
  value: SettingValue
}
