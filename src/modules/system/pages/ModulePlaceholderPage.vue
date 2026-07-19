<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/ui/PageHeader.vue'

const props = defineProps<{
  module: string
}>()

const { t } = useI18n()

const moduleTitle = computed(() => {
  const key = props.module.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())

  return t(`nav.${key}`)
})
</script>

<template>
  <PageHeader
    :title="moduleTitle"
    :description="t('states.placeholderDescription')"
  />
  <div class="panel p-6 text-sm text-text-muted">
    {{ t('states.placeholderBody') }}
  </div>
</template>
