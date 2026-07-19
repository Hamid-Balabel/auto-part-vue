<script setup lang="ts">
defineProps<{
  id: string
  label: string
  modelValue: string | null
  error?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="block" :for="id">
    <span class="form-label">{{ label }} <span v-if="required" class="text-danger">*</span></span>
    <input
      :id="id"
      class="form-control mt-1.5"
      type="date"
      :value="modelValue ?? ''"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="form-error">{{ error }}</span>
  </label>
</template>
