<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import BasePhoneInput, { type PhoneInputValue } from '@/components/forms/BasePhoneInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { CustomerPayload } from '@/modules/inventory/types'
import type { Country } from '@/modules/data-entry/types'

const props = defineProps<{ open: boolean; loading?: boolean; countriesLoading?: boolean; countries: Country[]; errors?: Record<string, string[]> }>()
const emit = defineEmits<{ close: []; submit: [payload: CustomerPayload] }>()
const form = reactive<CustomerPayload>({ name: '', email: '', phone: '', phone_code_id: null })
const phoneValue = computed<PhoneInputValue>({
  get: () => ({ phone_code_id: form.phone_code_id ?? null, phone: form.phone ?? '' }),
  set: (value) => {
    form.phone_code_id = value.phone_code_id
    form.phone = value.phone
  },
})

watch(() => props.open, (open) => {
  if (open) Object.assign(form, { name: '', email: '', phone: '', phone_code_id: null })
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form class="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-elevated" @submit.prevent="emit('submit', { ...form })">
      <h2 class="text-lg font-bold text-text">{{ $t('sales.quickCustomer') }}</h2>
      <p class="mt-1 text-sm text-text-muted">{{ $t('sales.quickCustomerDescription') }}</p>
      <div class="mt-5 grid gap-4">
        <FormInput id="quick-customer-name" v-model="form.name" :label="$t('admin.name')" :error="errors?.name?.[0]" required />
        <BasePhoneInput id="quick-customer-phone" v-model="phoneValue" :label="$t('admin.phone')" :countries="countries" :loading="countriesLoading" :country-error="errors?.phone_code_id?.[0]" :phone-error="errors?.phone?.[0]" compact />
        <FormInput id="quick-customer-email" v-model="form.email" :label="$t('admin.email')" type="email" :error="errors?.email?.[0]" />
      </div>
      <div class="mt-6 flex justify-end gap-2"><BaseButton variant="secondary" type="button" @click="emit('close')">{{ $t('actions.cancel') }}</BaseButton><BaseButton type="submit" :loading="loading" :disabled="!form.name">{{ $t('sales.createAndSelectCustomer') }}</BaseButton></div>
    </form>
  </div>
</template>
