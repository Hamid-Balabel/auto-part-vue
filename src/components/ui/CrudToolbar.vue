<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  search?: string
  searchPlaceholder?: string
  searchDisabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  search: [value: string]
  refresh: []
}>()

const { t } = useI18n()
const localSearch = ref(props.search ?? '')

watch(() => props.search, (value) => {
  localSearch.value = value ?? ''
})
</script>

<template>
  <div class="panel mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
    <form class="flex flex-1 flex-col gap-2 sm:flex-row" @submit.prevent="emit('search', localSearch)">
      <input
        v-model="localSearch"
        class="form-control"
        type="search"
        :placeholder="searchPlaceholder ?? t('crud.searchPlaceholder')"
        :disabled="searchDisabled || loading"
      />
      <div class="flex gap-2">
        <BaseButton variant="secondary" type="submit" :disabled="searchDisabled || loading">{{ t('actions.search') }}</BaseButton>
        <BaseButton variant="ghost" type="button" :disabled="searchDisabled || loading || !localSearch" @click="localSearch = ''; emit('search', '')">{{ t('actions.clear') }}</BaseButton>
      </div>
    </form>
    <BaseButton variant="outline" type="button" :loading="loading" @click="emit('refresh')">{{ t('actions.refresh') }}</BaseButton>
  </div>
</template>
