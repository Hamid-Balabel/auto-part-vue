<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FormInput from '@/components/forms/FormInput.vue'
import BooleanField from '@/components/forms/BooleanField.vue'
import TranslatableFields from '@/components/forms/TranslatableFields.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { createWarehouse, getWarehouse, updateWarehouse } from '../api'
import type { WarehousePayload } from '../types'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('warehouse')
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const form = reactive<WarehousePayload>({
  name: { ar: '', en: '' },
  description: { ar: '', en: '' },
  address: '',
  is_active: true,
})
const isEdit = computed(() => Boolean(props.id))
async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const warehouse = await getWarehouse(props.id)
    form.name = warehouse.translation_name ?? { ar: '', en: '' }
    form.description = warehouse.translation_description ?? { ar: '', en: '' }
    form.address = warehouse.address ?? ''
    form.is_active = normalizeBoolean(warehouse.is_active, true)
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    const payload: WarehousePayload = {
      name: form.name,
      description: form.description,
      address: form.address || null,
      is_active: form.is_active,
    }
    if (props.id) await updateWarehouse(props.id, payload)
    else await createWarehouse(payload)
    toast.success(t('crud.saved'))
    await router.push({ name: 'warehouses.index' })
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
  <FormPageLayout
    :title="t(isEdit ? 'inventory.editWarehouse' : 'inventory.createWarehouse')"
    :description="t('inventory.warehouseFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('inventory.loadingWarehouse') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <TranslatableFields
        id="warehouse_name"
        v-model="form.name"
        :label-ar="t('dataEntry.nameAr')"
        :label-en="t('dataEntry.nameEn')"
        required-ar
        :error-ar="errors.name?.[0] ?? errors['name.ar']?.[0]"
        :error-en="errors['name.en']?.[0]"
      />
      <TranslatableFields
        id="warehouse_description"
        v-model="form.description"
        :label-ar="t('dataEntry.descriptionAr')"
        :label-en="t('dataEntry.descriptionEn')"
        :error-ar="errors['description.ar']?.[0]"
        :error-en="errors['description.en']?.[0]"
      />
      <FormInput id="warehouse_address" v-model="form.address" :label="t('table.address')" :error="errors.address?.[0]" />
      <BooleanField id="warehouse_status" v-model="form.is_active" :label="t('dataEntry.status')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" data-testid="warehouse-active-field" />
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'warehouses.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
