import { http, unwrapData } from '@/api/http'
import { toFormData } from '@/api/formData'
import type { ApiEnvelope, ListQuery, Paginated } from '@/types/api'
import type { Permission, Role, RolePayload, SettingGroup, SettingUpdateItem, SettingValue, User, UserPayload } from './types'

export async function listUsers(query: ListQuery = {}): Promise<Paginated<User>> {
  const response = await http.get<ApiEnvelope<Paginated<User>>>('/users', { params: query })

  return unwrapData(response)
}

export async function getUser(id: string | number): Promise<User> {
  const response = await http.get<ApiEnvelope<User>>(`/users/${id}`)

  return unwrapData(response)
}

export async function createUser(payload: UserPayload): Promise<User> {
  const response = await http.post<ApiEnvelope<User>>('/users', toFormData({ ...payload }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return unwrapData(response)
}

export async function updateUser(id: string | number, payload: UserPayload): Promise<User> {
  const response = await http.post<ApiEnvelope<User>>(`/users/${id}`, toFormData({ ...payload, _method: 'PUT' }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return unwrapData(response)
}

export async function deleteUser(id: number): Promise<void> {
  await http.delete('/users/delete', { data: { id } })
}

export async function toggleUser(id: number): Promise<void> {
  await http.put('/users/toggle-active', { id })
}

export async function listRoles(query: ListQuery = {}): Promise<Paginated<Role> | Role[]> {
  const response = await http.get<ApiEnvelope<Paginated<Role> | Role[]>>('/roles', { params: query })

  return unwrapData(response)
}

export async function getRole(id: string | number): Promise<Role> {
  const response = await http.get<ApiEnvelope<Role>>(`/roles/${id}`)

  return unwrapData(response)
}

export async function createRole(payload: RolePayload): Promise<Role> {
  const response = await http.post<ApiEnvelope<Role>>('/roles', payload)

  return unwrapData(response)
}

export async function updateRole(id: string | number, payload: RolePayload): Promise<Role> {
  const response = await http.put<ApiEnvelope<Role>>(`/roles/${id}`, payload)

  return unwrapData(response)
}

export async function deleteRole(id: number): Promise<void> {
  await http.delete('/roles/delete', { data: { id } })
}

export async function listPermissions(query: ListQuery = {}): Promise<Paginated<Permission> | Permission[]> {
  const response = await http.get<ApiEnvelope<Paginated<Permission> | Permission[]>>('/permissions', { params: query })

  return unwrapData(response)
}

export async function listSettings(): Promise<SettingGroup[]> {
  const response = await http.get<ApiEnvelope<SettingGroup[]>>('/settings')

  return unwrapData(response)
}

export async function updateSettings(settings: SettingUpdateItem[]): Promise<void> {
  if (settings.some((setting) => containsFile(setting.value))) {
    await http.put('/settings', settingsToFormData(settings), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return
  }

  await http.put('/settings', { settings })
}

function containsFile(value: SettingValue): boolean {
  if (value instanceof File) return true
  if (Array.isArray(value)) return value.some((item) => item instanceof File)
  if (value && typeof value === 'object') return Object.values(value).some((item) => item instanceof File)
  return false
}

function settingsToFormData(settings: SettingUpdateItem[]): FormData {
  const formData = new FormData()

  settings.forEach((setting, index) => {
    formData.append(`settings[${index}][key]`, setting.key)
    formData.append(`settings[${index}][group]`, setting.group)
    appendSettingValue(formData, `settings[${index}][value]`, setting.value)
  })

  return formData
}

function appendSettingValue(formData: FormData, key: string, value: SettingValue) {
  if (value === undefined || value === null) {
    formData.append(key, '')
    return
  }

  if (value instanceof File) {
    formData.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendSettingValue(formData, `${key}[${index}]`, item as SettingValue))
    return
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => appendSettingValue(formData, `${key}[${nestedKey}]`, nestedValue as SettingValue))
    return
  }

  formData.append(key, String(value))
}
