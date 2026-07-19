import type { SettingItem, SettingValue, TranslationMap } from '@/modules/admin/types'
import { normalizeBoolean } from '@/utils/boolean'

export type NormalizedSettingType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'color'
  | 'image'
  | 'file'
  | 'date'
  | 'time'
  | 'datetime'
  | 'json'
  | 'editor'
  | 'phone'
  | 'url'

export interface SettingOption {
  label: string
  value: string
}

export function normalizeSettingType(type?: string | null): NormalizedSettingType {
  const normalized = String(type ?? 'text').trim().toLowerCase()

  if (['textarea'].includes(normalized)) return 'textarea'
  if (['number', 'integer', 'float', 'decimal'].includes(normalized)) return 'number'
  if (['email'].includes(normalized)) return 'email'
  if (['password', 'secret'].includes(normalized)) return 'password'
  if (['checkbox', 'check_box', 'check-box', 'checkBox'.toLowerCase(), 'radio', 'boolean', 'bool', 'switchbox', 'switch', 'toggle'].includes(normalized)) return 'boolean'
  if (['select', 'dropdown', 'radioselect'].includes(normalized)) return 'select'
  if (['multiselect', 'multi_select', 'multi-select', 'checkboxlist'].includes(normalized)) return 'multiselect'
  if (['color', 'colour', 'colorpicker'].includes(normalized)) return 'color'
  if (['image', 'imageuploader', 'image_upload', 'image-upload', 'avatar'].includes(normalized)) return 'image'
  if (['file', 'fileupload', 'file_upload', 'file-upload'].includes(normalized)) return 'file'
  if (['date'].includes(normalized)) return 'date'
  if (['time'].includes(normalized)) return 'time'
  if (['datetime', 'datetime-local', 'date_time', 'timestamp'].includes(normalized)) return 'datetime'
  if (['json', 'array', 'object'].includes(normalized)) return 'json'
  if (['editor', 'html', 'richtext', 'rich_text'].includes(normalized)) return 'editor'
  if (['phone', 'tel', 'telephone'].includes(normalized)) return 'phone'
  if (['url', 'uri', 'link'].includes(normalized)) return 'url'

  return 'text'
}

export function translatedText(value: TranslationMap | string | null | undefined, locale: string, fallback = ''): string {
  if (!value) return fallback
  if (typeof value === 'string') return value
  const language = locale === 'ar' ? 'ar' : 'en'
  return value[language] ?? value.en ?? value.ar ?? fallback
}

export function settingLabel(setting: SettingItem, locale: string): string {
  return translatedText(setting.label, locale, setting.translated_label ?? setting.key)
}

export function settingPlaceholder(setting: SettingItem, locale: string): string {
  return translatedText(setting.placeholder, locale, setting.translated_placeholder ?? '')
}

export function humanizeSettingKey(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function isMultiLang(setting: SettingItem): boolean {
  return Number(setting.is_multi_lang ?? 0) === 1
}

export function parseSettingOptions(setting: SettingItem, locale: string): SettingOption[] {
  const text = [
    translatedText(setting.placeholder, locale),
    translatedText(setting.placeholder, locale === 'ar' ? 'en' : 'ar'),
    setting.translated_placeholder ?? '',
  ].find((item) => /options\s*:|الخيارات\s*:/i.test(item)) ?? ''

  const rawOptions = text
    .replace(/^.*?(options\s*:|الخيارات\s*:)/i, '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean)

  return rawOptions.map((option) => ({ label: option, value: option === 'null' ? '' : option }))
}

export function coerceBoolean(value: SettingValue): boolean {
  return normalizeBoolean(value as boolean | number | string | null | undefined)
}

export function isFileValue(value: SettingValue): value is File {
  return value instanceof File
}
