<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BasePhoneInput, { type PhoneInputValue } from '@/components/forms/BasePhoneInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { useAdminStore } from '@/stores/admin'
import { createCustomer, getCustomer, updateCustomer } from '../api'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const adminStore = useAdminStore()
const permissions = useResourcePermissions('customer')
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const form = reactive({
  name: '',
  email: '',
  phone: { phone_code_id: null, phone: '' } as PhoneInputValue,
})
const isEdit = computed(() => Boolean(props.id))

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const customer = await getCustomer(props.id)
    form.name = customer.name ?? ''
    form.email = customer.email ?? ''
    form.phone = {
      phone_code_id: customer.phone_code_id ?? null,
      phone: customer.phone ?? '',
    }
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    const payload = {
      name: form.name,
      email: form.email || null,
      phone_code_id: form.phone.phone_code_id,
      phone: form.phone.phone || null,
    }
    if (props.id) await updateCustomer(props.id, payload)
    else await createCustomer(payload)
    toast.success(t('crud.saved'))
    await router.push({ name: 'customers.index' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([adminStore.loadCountries(), loadRecord()])
})
</script>

<template>
  <FormPageLayout
    :title="t(isEdit ? 'inventory.editCustomer' : 'inventory.createCustomer')"
    :description="t('inventory.customerFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('inventory.loadingCustomer') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <FormInput id="customer_name" v-model="form.name" :label="t('admin.name')" required :error="errors.name?.[0]" autocomplete="name" />
      <FormInput id="customer_email" v-model="form.email" :label="t('admin.email')" type="email" :error="errors.email?.[0]" autocomplete="email" />
      <div class="md:col-span-2">
        <BasePhoneInput
          id="customer_phone"
          v-model="form.phone"
          :label="t('admin.phone')"
          :countries="adminStore.countries"
          :loading="adminStore.countriesLoading"
          :country-error="errors.phone_code_id?.[0]"
          :phone-error="errors.phone?.[0]"
        />
      </div>
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'customers.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
