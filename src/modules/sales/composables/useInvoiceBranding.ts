import { computed, ref } from 'vue'
import { listSettings } from '@/modules/admin/api'
import type { SettingGroup, SettingItem } from '@/modules/admin/types'
import type { Branch } from '@/modules/inventory/types'
import { useAuthStore } from '@/stores/auth'

type LocaleCode = string

export interface InvoiceBranding {
  branchName: string
  phone: string
  companyName: string
  address: string
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

let cachedSettings: SettingItem[] | null = null
let cacheTimestamp = 0
let pendingSettings: Promise<SettingItem[]> | null = null

function flattenSettingGroups(groups: SettingGroup[] = []): SettingItem[] {
  return groups.flatMap((group) => [
    ...(group.items ?? []),
    ...flattenSettingGroups(group.nested ?? []),
  ])
}

function localizedString(value: unknown, locale: LocaleCode): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number')
    return String(value).trim()
  if (typeof value === 'boolean') return value ? 'true' : ''
  if (Array.isArray(value)) return value.map((item) => localizedString(item, locale)).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const map = value as Record<string, unknown>
    return (
      localizedString(map[locale], locale) ||
      localizedString(map.ar, locale) ||
      localizedString(map.en, locale)
    )
  }
  return ''
}

function settingValue(item: SettingItem | undefined, locale: LocaleCode): string {
  if (!item) return ''
  return localizedString(item.value, locale) || localizedString(item.translated_value, locale)
}

function getSetting(items: SettingItem[], group: string, key: string) {
  return items.find((item) => item.group === group && item.key === key)
}

function isCacheValid(): boolean {
  return cachedSettings !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS
}

async function loadInvoiceSettings(): Promise<SettingItem[]> {
  if (isCacheValid()) return cachedSettings!
  if (!pendingSettings) {
    pendingSettings = listSettings()
      .then((groups) => {
        cachedSettings = flattenSettingGroups(groups)
        cacheTimestamp = Date.now()
        return cachedSettings
      })
      .catch(() => {
        // Do not cache failed results; allow retry on next call
        cachedSettings = null
        cacheTimestamp = 0
        return []
      })
      .finally(() => {
        pendingSettings = null
      })
  }

  return pendingSettings
}

export function resolveBranchName(branch: Branch | null, locale: LocaleCode) {
  const localizedName =
    locale === 'en' ? branch?.translation_name?.en : branch?.translation_name?.ar

  return (
    branch?.name ??
    localizedName ??
    branch?.translation_name?.ar ??
    branch?.translation_name?.en ??
    ''
  )
}

export function useInvoiceBranding(locale: { value: LocaleCode }) {
  const auth = useAuthStore()
  const settings = ref<SettingItem[]>(cachedSettings ?? [])
  const loaded = ref(Boolean(cachedSettings))

  async function ensureBrandingLoaded() {
    if (loaded.value && isCacheValid()) return
    settings.value = await loadInvoiceSettings()
    loaded.value = true
  }

  const branding = computed<InvoiceBranding>(() => ({
    branchName: resolveBranchName(auth.currentBranch, locale.value),
    phone: settingValue(
      getSetting(settings.value, 'general.contact', 'contact_phone'),
      locale.value,
    ),
    companyName: settingValue(
      getSetting(settings.value, 'general.info', 'name'),
      locale.value,
    ),
    address: settingValue(
      getSetting(settings.value, 'general.contact', 'contact_address'),
      locale.value,
    ),
  }))

  return { branding, ensureBrandingLoaded }
}
