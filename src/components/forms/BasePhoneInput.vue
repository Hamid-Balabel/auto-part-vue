<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Country } from '@/modules/data-entry/types'
import SearchableSelectInput, { type SearchableSelectOption } from './SearchableSelectInput.vue'

export interface PhoneInputValue {
  phone_code_id: number | string | null
  phone: string
}

const props = defineProps<{
  id: string
  label: string
  modelValue: PhoneInputValue
  countries: Country[]
  loading?: boolean
  disabled?: boolean
  countryError?: string
  phoneError?: string
  required?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PhoneInputValue]
}>()

const { locale, t } = useI18n()

const selectedCountry = computed(() => props.countries.find((country) => String(country.id) === String(props.modelValue.phone_code_id ?? '')))
const maxLength = computed(() => selectedCountry.value?.phone_length ? Number(selectedCountry.value.phone_length) : undefined)
const localError = computed(() => {
  if (!props.modelValue.phone) return ''
  if (!selectedCountry.value) return t('phone.selectCountry')
  if (maxLength.value && props.modelValue.phone.length !== maxLength.value) return t('phone.exactLength', { length: maxLength.value })
  return ''
})
const countryOptions = computed<SearchableSelectOption<number>[]>(() => props.countries.map((country) => {
  const localizedName = locale.value === 'ar' ? country.name?.ar : country.name?.en
  const fallbackName = country.translation_name ?? country.name?.en ?? country.name?.ar ?? country.code
  const label = localizedName ?? fallbackName ?? country.code
  return {
    label,
    value: country.id,
    meta: country.phone_code ? `(${country.phone_code})` : undefined,
    description: country.code,
    icon: flagEmoji(country.code),
    searchText: [country.name?.ar, country.name?.en, country.translation_name, country.code, country.phone_code].filter(Boolean).join(' '),
  }
}))
const visiblePhoneError = computed(() => props.phoneError || localError.value)

function flagEmoji(code?: string | null): string {
  if (!code || code.length < 2) return ''
  const iso2 = code.slice(0, 2).toUpperCase()
  if (!/^[A-Z]{2}$/.test(iso2)) return ''
  return Array.from(iso2).map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('')
}

function updateCountry(value: number | null) {
  emit('update:modelValue', { ...props.modelValue, phone_code_id: value })
}

function updatePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  emit('update:modelValue', {
    ...props.modelValue,
    phone: maxLength.value ? digits.slice(0, maxLength.value) : digits,
  })
}
</script>

<template>
  <div>
    <p class="form-label">{{ label }} <span v-if="required" class="text-danger">*</span></p>
    <div class="mt-1.5 grid gap-3" :class="compact ? 'grid-cols-1' : 'lg:grid-cols-[minmax(17rem,0.85fr)_minmax(16rem,1.15fr)]'">
      <SearchableSelectInput
        :id="`${id}_country`"
        :model-value="modelValue.phone_code_id === null || modelValue.phone_code_id === '' ? null : Number(modelValue.phone_code_id)"
        :label="t('phone.countryCode')"
        :options="countryOptions"
        :placeholder="t('phone.selectCountry')"
        :search-placeholder="t('phone.searchCountry')"
        :empty-text="t('phone.noCountries')"
        :loading="loading"
        :disabled="disabled"
        :error="countryError"
        data-testid="phone-country-select"
        @update:model-value="updateCountry"
      />
      <label class="block" :for="`${id}_phone`">
        <span class="form-label">{{ t('admin.phone') }}</span>
        <input
          :id="`${id}_phone`"
          class="form-control mt-1.5"
          :value="modelValue.phone"
          :maxlength="maxLength"
          inputmode="numeric"
          autocomplete="tel-national"
          :disabled="disabled"
          :aria-invalid="visiblePhoneError ? 'true' : 'false'"
          :aria-describedby="visiblePhoneError ? `${id}_phone-error` : `${id}_phone-help`"
          data-testid="phone-number-input"
          @input="updatePhone(($event.target as HTMLInputElement).value)"
        />
        <span v-if="selectedCountry && maxLength && !visiblePhoneError" :id="`${id}_phone-help`" class="mt-1.5 block text-xs text-text-muted">
          {{ t('phone.exactLength', { length: maxLength }) }}
        </span>
        <span v-if="visiblePhoneError" :id="`${id}_phone-error`" class="form-error">{{ visiblePhoneError }}</span>
      </label>
    </div>
  </div>
</template>
