<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string | null
}>()
</script>

<template>
  <article class="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h4 class="break-words text-sm font-bold text-text">{{ title }}</h4>
        <p v-if="subtitle" class="mt-1 break-words text-xs text-text-muted">{{ subtitle }}</p>
      </div>
      <slot name="badge" />
    </div>
    <div v-if="$slots.default" class="mt-3 grid gap-2 sm:grid-cols-2">
      <slot />
    </div>
  </article>
</template>
