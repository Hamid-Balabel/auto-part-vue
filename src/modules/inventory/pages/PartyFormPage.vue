<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BaseCheckbox from '@/components/forms/BaseCheckbox.vue'
import BooleanField from '@/components/forms/BooleanField.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { DEFAULT_PARTY_PHONE_DIGITS, digitsOnly } from '@/config/party'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { normalizeBoolean } from '@/utils/boolean'
import { createParty, getParty, updateParty } from '../api'
import type { PartyClassification, PartyPayload } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('party')
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const form = reactive<PartyPayload>({ name: '', email: '', phone: '', is_active: true, classifications: ['customer'] })

watch(() => form.phone, (value) => { const next = digitsOnly(value ?? ''); if (value !== next) form.phone = next })
function setClassification(value: PartyClassification, checked: boolean) { const set = new Set(form.classifications); if (checked) set.add(value); else set.delete(value); form.classifications = [...set] as PartyClassification[] }
async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const party = await getParty(props.id)
    form.name = party.name
    form.email = party.email ?? ''
    form.phone = digitsOnly(party.phone ?? '')
    form.is_active = normalizeBoolean(party.is_active, true)
    form.classifications = [...party.classifications]
  } catch (error) {
    if (error instanceof ApiError) errorMessage.value = error.message
  } finally { loading.value = false }
}
async function submit() {
  saving.value = true; errors.value = {}; errorMessage.value = ''
  try {
    const payload: PartyPayload = { name: form.name, email: form.email || null, phone: form.phone || null, is_active: form.is_active, classifications: form.classifications }
    if (props.id) await updateParty(props.id, payload); else await createParty(payload)
    toast.success(t('crud.saved'))
    await router.push({ name: 'parties.index' })
  } catch (error) {
    if (error instanceof ApiError) { errors.value = error.errors ?? {}; errorMessage.value = error.message }
  } finally { saving.value = false }
}
onMounted(loadRecord)
</script>

<template>
  <FormPageLayout :title="t(isEdit ? 'parties.edit' : 'parties.add')" :description="t('parties.formDescription')" :error-message="errorMessage" :loading-text="loading ? t('parties.loading') : ''" data-testid="party-form" @submit="submit">
    <div class="grid gap-4 md:grid-cols-2">
      <FormInput id="party_name" v-model="form.name" :label="t('admin.name')" required :error="errors.name?.[0]" autocomplete="name" />
      <FormInput id="party_phone" v-model="form.phone" :label="t('admin.phone')" inputmode="numeric" pattern="[0-9]*" :maxlength="DEFAULT_PARTY_PHONE_DIGITS" :help="t('phone.exactLength', { length: DEFAULT_PARTY_PHONE_DIGITS })" :error="errors.phone?.[0]" autocomplete="tel" />
      <FormInput id="party_email" v-model="form.email" :label="t('admin.email')" type="email" :error="errors.email?.[0]" autocomplete="email" />
      <BooleanField id="party_status" v-model="form.is_active" :label="t('dataEntry.status')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" />
      <fieldset class="rounded-[var(--radius-lg)] border border-border p-4 md:col-span-2">
        <legend class="px-1 text-sm font-semibold text-text">{{ t('parties.classifications') }}</legend>
        <div class="mt-3 flex flex-wrap gap-4">
          <BaseCheckbox id="party_customer" :model-value="form.classifications.includes('customer')" :label="t('parties.customer')" @update:model-value="setClassification('customer', Boolean($event))" />
          <BaseCheckbox id="party_supplier" :model-value="form.classifications.includes('supplier')" :label="t('parties.supplier')" @update:model-value="setClassification('supplier', Boolean($event))" />
        </div>
        <p v-if="errors.classifications?.[0]" class="form-error mt-2">{{ errors.classifications[0] }}</p>
      </fieldset>
    </div>
    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'parties.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
