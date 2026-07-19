<script setup lang="ts">
import { formatMoney } from '@/utils/format'

defineProps<{
  value: number | string | null | undefined
  currency?: string
}>()
</script>

<template>
  <span class="font-semibold tabular-nums text-text">{{ formatMoney(value, currency) }}</span>
</template>
