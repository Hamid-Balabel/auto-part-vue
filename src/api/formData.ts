export function toFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    appendFormValue(formData, key, value)
  })

  return formData
}

function appendFormValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return

  if (value instanceof File) {
    formData.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormValue(formData, `${key}[${index}]`, item))
    return
  }

  if (typeof value === 'boolean') {
    formData.append(key, value ? '1' : '0')
    return
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
      appendFormValue(formData, `${key}[${nestedKey}]`, nestedValue)
    })
    return
  }

  formData.append(key, String(value))
}
