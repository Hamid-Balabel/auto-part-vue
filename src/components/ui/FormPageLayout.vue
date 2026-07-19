<script setup lang="ts">
import PageHeader from './PageHeader.vue'

withDefaults(defineProps<{
  title: string
  description?: string
  loadingText?: string
  errorMessage?: string
  dataTestid?: string
}>(), {
  dataTestid: undefined,
})

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <section class="form-page" data-testid="form-page-layout">
    <PageHeader :title="title" :description="description" />

    <form :data-testid="dataTestid" class="form-page-card" @submit.prevent="emit('submit')">
      <div v-if="errorMessage" class="alert-danger">{{ errorMessage }}</div>
      <div v-if="loadingText" class="text-sm text-text-muted">{{ loadingText }}</div>

      <slot />

      <div v-if="$slots.actions" class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <slot name="actions" />
      </div>
    </form>
  </section>
</template>
