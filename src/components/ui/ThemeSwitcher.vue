<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import { setTheme, theme } from '@/plugins/theme'

const { t } = useI18n()
const isDark = computed(() => theme.value === 'dark')
const label = computed(() => t(isDark.value ? 'common.lightMode' : 'common.darkMode'))

function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}
</script>

<template>
  <BaseButton
    variant="outline"
    type="button"
    class="size-10 shrink-0 p-0"
    :aria-label="label"
    :title="label"
    :aria-pressed="isDark"
    data-testid="theme-switcher"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" class="size-4" aria-hidden="true" />
    <Moon v-else class="size-4" aria-hidden="true" />
  </BaseButton>
</template>
