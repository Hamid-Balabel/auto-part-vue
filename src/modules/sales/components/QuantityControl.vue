<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number
  disabled?: boolean
  loading?: boolean
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const localValue = ref(String(props.modelValue))

watch(() => props.modelValue, (value) => { localValue.value = String(value) })

function commit(value: number) {
  const normalized = Math.max(1, Math.floor(value || 1))
  localValue.value = String(normalized)
  if (normalized !== props.modelValue) emit('update:modelValue', normalized)
}
</script>

<template>
  <div class="inline-flex items-center rounded-[var(--radius-lg)] border border-border bg-surface" :aria-label="label">
    <button class="flex size-9 items-center justify-center text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-50" type="button" :disabled="disabled || loading || modelValue <= 1" :aria-label="$t('sales.decreaseQuantity')" @click="commit(modelValue - 1)">
      <Minus class="size-4" aria-hidden="true" />
    </button>
    <input v-model="localValue" class="h-9 w-14 border-x border-border bg-transparent text-center text-sm font-bold tabular-nums focus:outline-none" inputmode="numeric" min="1" type="number" :disabled="disabled || loading" :aria-label="label" @change="commit(Number(localValue))" @blur="commit(Number(localValue))" />
    <button class="flex size-9 items-center justify-center text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-50" type="button" :disabled="disabled || loading" :aria-label="$t('sales.increaseQuantity')" @click="commit(modelValue + 1)">
      <Plus class="size-4" aria-hidden="true" />
    </button>
  </div>
</template>
