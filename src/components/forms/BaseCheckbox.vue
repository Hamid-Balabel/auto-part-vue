<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  id?: string
  modelValue: boolean
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  dataTestid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

watchEffect(() => {
  if (inputRef.value) inputRef.value.indeterminate = Boolean(props.indeterminate)
})
</script>

<template>
  <label class="inline-flex items-center gap-2 text-sm font-medium text-text" :class="disabled ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : 'cursor-pointer'">
    <input
      ref="inputRef"
      :id="id"
      class="rounded border-border text-primary transition focus:ring-primary disabled:cursor-not-allowed"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :aria-checked="indeterminate ? 'mixed' : modelValue"
      :data-testid="dataTestid"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span v-if="label">{{ label }}</span>
    <slot v-else />
  </label>
</template>
