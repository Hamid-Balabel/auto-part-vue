<script setup lang="ts">
import { Languages } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyLocale, type AppLocale } from '@/plugins/i18n'

const { locale, t } = useI18n()

const currentLocale = computed(() => locale.value as AppLocale)

function switchLocale(nextLocale: AppLocale) {
  locale.value = nextLocale
  applyLocale(nextLocale)
}
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm" :aria-label="t('common.language')">
    <Languages class="mx-2 size-4 text-text-muted" />
    <button
      class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
      :class="currentLocale === 'ar' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-text-muted hover:bg-primary-soft hover:text-primary-hover'"
      type="button"
      @click="switchLocale('ar')"
    >
      {{ t('common.arabic') }}
    </button>
    <button
      class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
      :class="currentLocale === 'en' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-text-muted hover:bg-primary-soft hover:text-primary-hover'"
      type="button"
      @click="switchLocale('en')"
    >
      {{ t('common.english') }}
    </button>
  </div>
</template>
