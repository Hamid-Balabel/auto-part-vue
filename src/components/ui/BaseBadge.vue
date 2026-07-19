<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}>(), {
  variant: 'neutral',
})

const classes = computed(() => ({
  primary: 'bg-primary-soft text-primary ring-primary/20',
  secondary: 'bg-secondary-soft text-secondary-hover ring-secondary/20',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  neutral: 'bg-neutral-soft text-neutral ring-neutral/20',
}[props.variant]))
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1" :class="classes">
    <slot />
  </span>
</template>
