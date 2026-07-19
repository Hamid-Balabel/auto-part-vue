export type PermissionRequirement = string | string[] | undefined

export function hasPermission(userPermissions: string[] | undefined, required?: PermissionRequirement): boolean {
  if (!required || (Array.isArray(required) && required.length === 0)) return true
  if (!userPermissions?.length) return false

  const requiredList = Array.isArray(required) ? required : [required]

  return requiredList.some((permission) => userPermissions.includes(permission))
}
