<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value?: unknown
  fallback?: string
}>(), {
  fallback: '—',
})
</script>

<template>
  <div class="rounded-[var(--radius-md)] border border-border bg-surface p-3">
    <dt class="text-xs font-semibold uppercase tracking-wide text-text-muted">{{ label }}</dt>
    <dd class="mt-1 break-words text-sm font-semibold text-text">
      <slot>{{ value === undefined || value === null || value === '' ? fallback : value }}</slot>
    </dd>
  </div>
</template>
