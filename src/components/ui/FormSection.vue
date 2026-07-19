<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="section-card">
    <div class="mb-4">
      <h2 class="text-base font-bold text-text">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-sm text-text-muted">{{ description }}</p>
    </div>
    <slot />
  </section>
</template>
