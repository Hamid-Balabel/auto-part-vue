<script setup lang="ts">
import { reactive, watch } from 'vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { DEFAULT_PARTY_PHONE_DIGITS, digitsOnly } from '@/config/party'
import type { PartyPayload } from '@/modules/inventory/types'

const props = defineProps<{ open: boolean; loading?: boolean; errors?: Record<string, string[]> }>()
const emit = defineEmits<{ close: []; submit: [payload: PartyPayload] }>()
const form = reactive<PartyPayload>({ name: '', email: '', phone: '', is_active: true, classifications: ['customer'] })
watch(() => props.open, (open) => { if (open) Object.assign(form, { name: '', email: '', phone: '', is_active: true, classifications: ['customer'] }) })
watch(() => form.phone, (value) => { const next = digitsOnly(value ?? ''); if (value !== next) form.phone = next })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form class="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-elevated" @submit.prevent="emit('submit', { ...form })">
      <h2 class="text-lg font-bold text-text">{{ $t('sales.quickCustomer') }}</h2>
      <p class="mt-1 text-sm text-text-muted">{{ $t('sales.quickCustomerDescription') }}</p>
      <div class="mt-5 grid gap-4">
        <FormInput id="quick-customer-name" v-model="form.name" :label="$t('admin.name')" :error="errors?.name?.[0]" required />
        <FormInput id="quick-customer-phone" v-model="form.phone" :label="$t('admin.phone')" inputmode="numeric" pattern="[0-9]*" :maxlength="DEFAULT_PARTY_PHONE_DIGITS" :help="$t('phone.exactLength', { length: DEFAULT_PARTY_PHONE_DIGITS })" :error="errors?.phone?.[0]" />
        <FormInput id="quick-customer-email" v-model="form.email" :label="$t('admin.email')" type="email" :error="errors?.email?.[0]" />
      </div>
      <div class="mt-6 flex justify-end gap-2"><BaseButton variant="secondary" type="button" @click="emit('close')">{{ $t('actions.cancel') }}</BaseButton><BaseButton type="submit" :loading="loading" :disabled="!form.name">{{ $t('sales.createAndSelectCustomer') }}</BaseButton></div>
    </form>
  </div>
</template>
