import { createI18n } from 'vue-i18n'
import ar from '@/locales/ar'
import en from '@/locales/en'

export type AppLocale = 'ar' | 'en'

const localeKey = 'auto_part_locale'
const defaultLocale: AppLocale = 'ar'

function isAppLocale(value: string | null): value is AppLocale {
  return value === 'ar' || value === 'en'
}

export function getStoredLocale(): AppLocale {
  const stored = window.localStorage.getItem(localeKey)

  return isAppLocale(stored) ? stored : defaultLocale
}

export function applyLocale(locale: AppLocale): void {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  window.localStorage.setItem(localeKey, locale)
}

const initialLocale = getStoredLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { ar, en },
})

applyLocale(initialLocale)
