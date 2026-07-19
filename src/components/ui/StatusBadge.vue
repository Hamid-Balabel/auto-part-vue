<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseBadge from './BaseBadge.vue'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{
  value: unknown
}>()

const { t } = useI18n()

const label = computed(() => {
  if (typeof props.value === 'boolean' || [0, 1, '0', '1', 'true', 'false', 'active', 'inactive'].includes(props.value as never)) {
    return normalizeBoolean(props.value as boolean | number | string) ? t('dataEntry.active') : t('dataEntry.inactive')
  }
  return String(props.value ?? 'Unknown')
})

const classes = computed(() => {
  const raw = String(props.value).toLowerCase()

  if (['true', '1', 'active', 'paid', 'completed', 'success'].includes(raw)) {
    return 'success'
  }

  if (['false', '0', 'inactive', 'failed', 'cancelled', 'unpaid'].includes(raw)) {
    return raw === 'failed' || raw === 'cancelled' ? 'danger' : 'neutral'
  }

  return 'neutral'
})
</script>

<template>
  <BaseBadge :variant="classes">
    {{ label }}
  </BaseBadge>
</template>
