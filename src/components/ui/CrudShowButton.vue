<script setup lang="ts">
import { Eye } from '@lucide/vue'
import BaseButton from './BaseButton.vue'

defineProps<{
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <BaseButton
    variant="ghost"
    size="sm"
    type="button"
    :loading="loading"
    :disabled="disabled"
    :aria-label="$t('actions.view')"
    @click="emit('click')"
  >
    <Eye v-if="!loading" class="size-4" aria-hidden="true" />
    <span class="sr-only">{{ $t('actions.view') }}</span>
  </BaseButton>
</template>
