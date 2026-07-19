export type BooleanLike = boolean | number | string | null | undefined

export function normalizeBoolean(value: BooleanLike, fallback = false): boolean {
  if (value === true || value === 1) return true
  if (value === false || value === 0) return false

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'active', 'enabled', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'inactive', 'disabled', 'no', 'off', ''].includes(normalized)) return false
  }

  return fallback
}
