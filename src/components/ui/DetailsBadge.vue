<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{
  value: boolean | string | number | null | undefined
}>()

const { t } = useI18n()
const isBooleanLike = computed(() => typeof props.value === 'boolean' || [0, 1, '0', '1', 'true', 'false', 'active', 'inactive'].includes(props.value as never))
const normalized = computed(() => normalizeBoolean(props.value))
const label = computed(() => isBooleanLike.value ? t(normalized.value ? 'dataEntry.active' : 'dataEntry.inactive') : props.value ?? '—')
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
    :class="isBooleanLike ? normalized ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger' : 'bg-secondary-soft text-secondary'"
  >
    <slot>
      {{ label }}
    </slot>
  </span>
</template>
