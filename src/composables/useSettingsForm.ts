import { computed, reactive, ref } from 'vue'
import type { SettingGroup, SettingItem, SettingValue } from '@/modules/admin/types'

export function useSettingsForm() {
  const groups = ref<SettingGroup[]>([])
  const values = reactive<Record<number, SettingValue>>({})
  const originalValues = reactive<Record<number, SettingValue>>({})
  const errors = reactive<Record<number, string>>({})

  const flatSettings = computed(() => flattenGroups(groups.value))
  const isDirty = computed(() => flatSettings.value.some((setting) => !sameValue(values[setting.id], originalValues[setting.id])))

  function setGroups(nextGroups: SettingGroup[]) {
    groups.value = nextGroups
    clearObject(values)
    clearObject(originalValues)
    clearErrors()

    flattenGroups(nextGroups).forEach((setting) => {
      const value = cloneSettingValue(setting.value as SettingValue)
      values[setting.id] = value
      originalValues[setting.id] = cloneSettingValue(value)
    })
  }

  function refreshGroups(nextGroups: SettingGroup[]) {
    flattenGroups(nextGroups).forEach((setting) => {
      const wasEdited = Object.prototype.hasOwnProperty.call(originalValues, setting.id)
        && !sameValue(values[setting.id], originalValues[setting.id])
      const nextValue = cloneSettingValue(setting.value as SettingValue)
      if (!wasEdited) values[setting.id] = cloneSettingValue(nextValue)
      originalValues[setting.id] = nextValue
    })
    groups.value = nextGroups
  }

  function resetSetting(id: number) {
    values[id] = cloneSettingValue(originalValues[id])
    delete errors[id]
  }

  function resetAll() {
    flatSettings.value.forEach((setting) => resetSetting(setting.id))
  }

  function clearErrors() {
    clearObject(errors)
  }

  function setApiErrors(apiErrors?: Record<string, string[]>) {
    clearErrors()
    if (!apiErrors) return

    flatSettings.value.forEach((setting, index) => {
      const message = apiErrors[`settings.${index}.value`]?.[0]
        ?? apiErrors[`settings.${index}.key`]?.[0]
        ?? apiErrors[`settings.${index}.group`]?.[0]

      if (message) errors[setting.id] = message
    })
  }

  function payload() {
    return flatSettings.value.map((setting) => ({
      key: setting.key,
      group: setting.group,
      value: values[setting.id] ?? null,
    }))
  }

  return {
    groups,
    values,
    originalValues,
    errors,
    flatSettings,
    isDirty,
    setGroups,
    refreshGroups,
    resetSetting,
    resetAll,
    clearErrors,
    setApiErrors,
    payload,
  }
}

function flattenGroups(groups: SettingGroup[]): SettingItem[] {
  return groups.flatMap((group) => [
    ...(group.items ?? []),
    ...flattenGroups(group.nested ?? []),
  ])
}

function cloneSettingValue(value: SettingValue): SettingValue {
  if (value instanceof File || value === null || value === undefined) return value ?? null
  if (Array.isArray(value)) return [...value]
  if (typeof value === 'object') return { ...value }
  return value
}

function sameValue(a: SettingValue, b: SettingValue): boolean {
  if (a instanceof File || b instanceof File) return a === b
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function clearObject(target: Record<string | number, unknown>) {
  Object.keys(target).forEach((key) => delete target[key])
}
