<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps<{ value: string }>()
const { t } = useI18n()

const variant = computed(() => ({
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'secondary',
  overdue: 'danger',
}[props.value] ?? 'neutral') as 'warning' | 'info' | 'success' | 'danger' | 'secondary' | 'neutral')

const label = computed(() => t(`sales.statuses.${props.value}`, props.value))
</script>

<template>
  <BaseBadge :variant="variant">{{ label }}</BaseBadge>
</template>
