import { useI18n } from 'vue-i18n'

type Translation = { ar?: string | null; en?: string | null }

export interface NamedTranslation {
  name?: string | Translation | null
  translation_name?: string | Translation | null
}

export function localizedName(record: NamedTranslation | null | undefined, locale: string, fallback = '—'): string {
  if (!record) return fallback

  const translations = typeof record.translation_name === 'object'
    ? record.translation_name
    : typeof record.name === 'object'
      ? record.name
      : null
  const primary = locale === 'en' ? 'en' : 'ar'
  const secondary = primary === 'ar' ? 'en' : 'ar'

  return translations?.[primary]?.trim()
    || translations?.[secondary]?.trim()
    || (typeof record.name === 'string' ? record.name.trim() : '')
    || (typeof record.translation_name === 'string' ? record.translation_name.trim() : '')
    || fallback
}

export function useLocalizedName() {
  const { locale } = useI18n()
  return (record: NamedTranslation | null | undefined, fallback = '—') => localizedName(record, locale.value, fallback)
}

export function useLocalizedDisplayName() {
  const { locale } = useI18n()
  return (record: { display_name?: Translation | string | null; translation_display_name?: string | null; name?: string | null } | null | undefined, fallback = '—') => {
    if (!record) return fallback
    const names = typeof record.display_name === 'object' ? record.display_name : null
    const primary = locale.value === 'en' ? 'en' : 'ar'
    const secondary = primary === 'ar' ? 'en' : 'ar'
    return names?.[primary]?.trim() || names?.[secondary]?.trim() || record.translation_display_name?.trim()
      || (typeof record.display_name === 'string' ? record.display_name.trim() : '') || record.name?.trim() || fallback
  }
}
