<script setup lang="ts">
import { X } from '@lucide/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{
  id: string
  label: string
  error?: string
  multiple?: boolean
  accept?: string
  managedFiles?: Array<{ key: string; name: string }>
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [files: File[]]
  remove: [key: string]
}>()

const { t } = useI18n()
const input = ref<HTMLInputElement | null>(null)

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('change', Array.from(target.files ?? []))
  if (props.managedFiles) target.value = ''
}
</script>

<template>
  <div v-if="managedFiles" class="block">
    <span class="form-label">{{ label }}</span>
    <input :id="id" ref="input" class="hidden" type="file" :multiple="multiple" :accept="accept" :disabled="disabled" @change="onChange" />
    <div class="mt-1.5 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-3">
      <BaseButton variant="outline" type="button" :disabled="disabled" @click="input?.click()">
        {{ t('inventory.chooseImages') }}
      </BaseButton>
      <ul v-if="managedFiles.length" class="mt-3 flex flex-wrap gap-2" :aria-label="label">
        <li v-for="file in managedFiles" :key="file.key" class="inline-flex max-w-full items-center gap-1 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 text-sm text-text">
          <span class="max-w-64 truncate" :title="file.name">{{ file.name }}</span>
          <BaseButton variant="ghost" size="sm" type="button" class="!min-h-7 !px-1" :disabled="disabled" :aria-label="t('inventory.removeImageNamed', { name: file.name })" @click="emit('remove', file.key)">
            <X class="size-4" aria-hidden="true" />
          </BaseButton>
        </li>
      </ul>
    </div>
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
  <label v-else class="block" :for="id">
    <span class="form-label">{{ label }}</span>
    <input
      :id="id"
      class="mt-1.5 block w-full rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-3 text-sm text-text-muted shadow-sm transition file:me-4 file:rounded-[var(--radius-sm)] file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast hover:border-primary/50 focus:border-primary focus:ring-primary"
      type="file"
      :multiple="multiple"
      :accept="accept"
      @change="onChange"
    />
    <span v-if="error" class="form-error">{{ error }}</span>
  </label>
</template>
