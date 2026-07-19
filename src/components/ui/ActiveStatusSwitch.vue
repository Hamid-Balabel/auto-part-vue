<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SwitchInput from '@/components/forms/SwitchInput.vue'
import { ApiError } from '@/api/http'
import { useToastStore } from '@/stores/toast'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{
  row: { id: number; is_active?: boolean | number | string }
  canToggle?: boolean
  toggle: (id: number) => Promise<void>
  dataTestid?: string
}>()

const { t } = useI18n()
const toast = useToastStore()
const loading = ref(false)

async function updateStatus(nextValue: boolean) {
  if (!props.canToggle || loading.value) return

  const previousValue = props.row.is_active
  props.row.is_active = nextValue
  loading.value = true

  try {
    await props.toggle(props.row.id)
    toast.success(t('crud.toggled'))
  } catch (error) {
    props.row.is_active = previousValue
    toast.error(error instanceof ApiError ? error.message : t('admin.failedToUpdateStatus'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <SwitchInput
    :data-testid="dataTestid"
    :model-value="normalizeBoolean(row.is_active)"
    :disabled="!canToggle"
    :loading="loading"
    :on-label="t('dataEntry.active')"
    :off-label="t('dataEntry.inactive')"
    @update:model-value="updateStatus"
  />
</template>
