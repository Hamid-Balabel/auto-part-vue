<script setup lang="ts">
defineProps<{
  id: string
  label: string
  error?: string
  multiple?: boolean
  accept?: string
}>()

const emit = defineEmits<{
  change: [files: File[]]
}>()
</script>

<template>
  <label class="block" :for="id">
    <span class="form-label">{{ label }}</span>
    <input
      :id="id"
      class="mt-1.5 block w-full rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-3 text-sm text-text-muted shadow-sm transition file:me-4 file:rounded-[var(--radius-sm)] file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast hover:border-primary/50 focus:border-primary focus:ring-primary"
      type="file"
      :multiple="multiple"
      :accept="accept"
      @change="emit('change', Array.from(($event.target as HTMLInputElement).files ?? []))"
    />
    <span v-if="error" class="form-error">{{ error }}</span>
  </label>
</template>
