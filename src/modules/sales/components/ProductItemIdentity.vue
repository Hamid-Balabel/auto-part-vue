<script setup lang="ts">
import { computed } from 'vue'
import { useLocalizedName } from '@/composables/useLocalizedName'
import type { ProductItem } from '@/modules/inventory/types'

const props = defineProps<{ item?: ProductItem | null }>()
const localizedName = useLocalizedName()

const name = computed(
  () =>
    localizedName(props.item?.product, props.item?.sku ?? '—'),
)
const image = computed(() => {
  const path = props.item?.images?.[0]?.path
  if (!path) return null
  return path.replace('https://auto-part.test/', 'http://auto-part.test/')
})
const options = computed(() =>
  (props.item?.option_values ?? props.item?.optionValues ?? [])
    .map(
      (option) =>
        localizedName(option, ''),
    )
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <div
      class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background"
    >
      <img
        v-if="image"
        :src="image"
        :alt="name"
        class="size-full object-cover"
      />
      <span v-else class="text-xs font-bold text-text-muted">{{
        item?.sku ?? '—'
      }}</span>
    </div>
    <div class="min-w-0">
      <p class="truncate font-bold text-text">{{ name }}</p>
      <p
        class="mt-0.5 truncate text-xs text-text-muted"
        :title="item?.sku ?? '—'"
      >
        {{ item?.sku ?? '—' }}
      </p>
      <p v-if="options" class="mt-1 line-clamp-2 text-xs text-secondary">
        {{ options }}
      </p>
    </div>
  </div>
</template>
