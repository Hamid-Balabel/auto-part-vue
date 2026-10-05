<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProductItem } from '@/modules/inventory/types'

const props = defineProps<{
  item?: ProductItem | null
  quickSaleTitle?: boolean
}>()

const { locale } = useI18n()

function localizedName(
  value?: {
    name?: string | null
    translation_name?: { ar?: string | null; en?: string | null }
  } | null,
) {
  const language = locale.value.startsWith('ar') ? 'ar' : 'en'
  return (
    value?.translation_name?.[language] ??
    value?.name ??
    value?.translation_name?.ar ??
    value?.translation_name?.en ??
    null
  )
}

const name = computed(
  () =>
    (props.quickSaleTitle ? localizedName(props.item?.product) : null) ??
    props.item?.product?.name ??
    props.item?.product?.translation_name?.ar ??
    props.item?.product?.translation_name?.en ??
    props.item?.sku ??
    '—',
)
const secondaryLine = computed(() => props.item?.sku || '—')
const image = computed(() => {
  const path = props.item?.images?.[0]?.path
  if (!path) return null
  return path.replace('https://auto-part.test/', 'http://auto-part.test/')
})
const options = computed(() =>
  (props.item?.option_values ?? props.item?.optionValues ?? [])
    .map(
      (option) =>
        option.name ??
        option.translation_name?.ar ??
        option.translation_name?.en,
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
      <p class="flex min-w-0 items-baseline gap-2 font-bold text-text">
        <span class="truncate">{{ name }}</span>
        <span
          v-if="quickSaleTitle && item?.movement_code"
          class="shrink-0 text-xs font-semibold text-text-muted"
          >{{ item.movement_code }}</span
        >
      </p>
      <p
        class="mt-0.5 truncate text-xs text-text-muted"
        :title="secondaryLine"
      >
        {{ secondaryLine }}
      </p>
      <p v-if="options" class="mt-1 line-clamp-2 text-xs text-secondary">
        {{ options }}
      </p>
    </div>
  </div>
</template>
