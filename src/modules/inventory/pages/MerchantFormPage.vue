<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BooleanField from '@/components/forms/BooleanField.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { normalizeBoolean } from '@/utils/boolean'
import { createMerchant, getMerchant, updateMerchant } from '../api'
import type { MerchantPayload } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('merchant')
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const form = reactive<MerchantPayload>({ name: '', email: '', phone: '', is_active: true })

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const merchant = await getMerchant(props.id)
    form.name = merchant.name
    form.email = merchant.email ?? ''
    form.phone = merchant.phone ?? ''
    form.is_active = normalizeBoolean(merchant.is_active, true)
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    const payload: MerchantPayload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      is_active: form.is_active,
    }
    if (props.id) await updateMerchant(props.id, payload)
    else await createMerchant(payload)
    toast.success(t('crud.saved'))
    await router.push({ name: 'merchants.index' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadRecord)
</script>

<template>
  <FormPageLayout :title="t(isEdit ? 'inventory.editMerchant' : 'inventory.addMerchant')" :description="t('inventory.merchantFormDescription')" :error-message="errorMessage" :loading-text="loading ? t('inventory.loadingMerchant') : ''" data-testid="merchant-form" @submit="submit">
    <div class="grid gap-4 md:grid-cols-2">
      <FormInput id="merchant_name" v-model="form.name" :label="t('admin.name')" required :error="errors.name?.[0]" autocomplete="name" />
      <FormInput id="merchant_email" v-model="form.email" :label="t('admin.email')" type="email" :error="errors.email?.[0]" autocomplete="email" />
      <FormInput id="merchant_phone" v-model="form.phone" :label="t('admin.phone')" :error="errors.phone?.[0]" autocomplete="tel" />
      <BooleanField id="merchant_status" v-model="form.is_active" :label="t('dataEntry.status')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" data-testid="merchant-active-field" />
    </div>
    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'merchants.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
