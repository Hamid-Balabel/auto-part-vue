<script setup lang="ts">
import { Edit3, Trash2 } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'
import BaseButton from './BaseButton.vue'

defineProps<{
  editTo?: RouteLocationRaw
  canEdit?: boolean
  canDelete?: boolean
  deleteDisabled?: boolean
}>()

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <div class="inline-flex items-center justify-end gap-1.5">
    <BaseButton v-if="canEdit && editTo" variant="ghost" size="sm" :to="editTo" :aria-label="$t('actions.edit')" :title="$t('actions.edit')">
      <Edit3 class="size-4" aria-hidden="true" />
    </BaseButton>
    <BaseButton v-if="canDelete" variant="danger" size="sm" type="button" :disabled="deleteDisabled" :aria-label="$t('actions.delete')" :title="$t('actions.delete')" @click="emit('delete')">
      <Trash2 class="size-4" aria-hidden="true" />
    </BaseButton>
  </div>
</template>
