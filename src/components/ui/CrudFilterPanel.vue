<script setup lang="ts">
import { ref, useId } from 'vue'
import { ChevronDown, SlidersHorizontal } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

withDefaults(defineProps<{
  activeCount?: number
  loading?: boolean
  resetDisabled?: boolean
  title?: string
  hint?: string
}>(), {
  activeCount: 0,
  loading: false,
  resetDisabled: false,
})

const emit = defineEmits<{
  apply: []
  reset: []
}>()

const { t } = useI18n()
const open = ref(false)
const contentId = useId()
</script>

<template>
  <section class="panel mb-5 overflow-visible" :aria-label="title ?? t('crud.filters')">
    <button
      class="group flex w-full items-center gap-3 rounded-[var(--radius-xl)] p-4 text-start transition hover:bg-primary-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:px-5"
      type="button"
      :aria-expanded="open"
      :aria-controls="contentId"
      data-testid="crud-filter-toggle"
      @click="open = !open"
    >
      <span class="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary-soft text-primary ring-1 ring-primary/15">
        <SlidersHorizontal class="size-5" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-bold text-text">{{ title ?? t('crud.filters') }}</span>
        <span class="mt-0.5 block text-xs text-text-muted sm:text-sm">{{ hint ?? t('crud.filtersHint') }}</span>
      </span>
      <span
        v-if="activeCount"
        class="shrink-0 rounded-full bg-secondary-soft px-2.5 py-1 text-xs font-bold text-secondary-hover ring-1 ring-secondary/20"
        data-testid="crud-filter-count"
      >
        {{ t('crud.activeFilters', { count: activeCount }) }}
      </span>
      <span class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition group-hover:border-primary/30 group-hover:text-primary">
        <ChevronDown class="size-4 transition-transform duration-300" :class="open ? 'rotate-180' : ''" />
      </span>
    </button>

    <Transition
      enter-active-class="transition-[max-height,opacity] duration-300 ease-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[80rem] opacity-100"
      leave-active-class="transition-[max-height,opacity] duration-200 ease-in overflow-hidden"
      leave-from-class="max-h-[80rem] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-show="open" :id="contentId" data-testid="crud-filter-content">
        <div class="border-t border-border/70 px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <slot />
          </div>
          <div class="mt-5 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
            <BaseButton variant="ghost" type="button" :disabled="resetDisabled || loading" @click="emit('reset')">
              {{ t('crud.resetFilters') }}
            </BaseButton>
            <BaseButton variant="secondary" type="button" :disabled="loading" @click="emit('apply')">
              {{ t('crud.applyFilters') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>
