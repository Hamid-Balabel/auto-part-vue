<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src?: string | null
  alt?: string | null
}>()

const normalizedSrc = computed(() => {
  if (!props.src) return null

  try {
    const url = new URL(props.src)
    if (url.hostname === 'auto-part.test' && url.protocol === 'https:') {
      url.protocol = 'http:'
      return url.toString()
    }
  } catch {
    return props.src
  }

  return props.src
})
</script>

<template>
  <div class="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background">
    <img v-if="normalizedSrc" :src="normalizedSrc" :alt="alt ?? ''" class="aspect-video w-full object-cover" loading="lazy" />
    <div v-else class="flex aspect-video items-center justify-center px-4 text-center text-sm text-text-muted">
      {{ $t('details.noImage') }}
    </div>
  </div>
</template>
