<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-[var(--radius-xl)] border border-border bg-background/60 p-4 shadow-sm">
    <header class="mb-4">
      <h3 class="text-base font-bold text-text">{{ title }}</h3>
      <p v-if="description" class="mt-1 text-sm text-text-muted">{{ description }}</p>
    </header>
    <slot />
  </section>
</template>
