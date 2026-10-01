import { ref } from 'vue'

export type AppTheme = 'light' | 'dark'

const themeKey = 'auto_part_theme'

function storedTheme(): AppTheme {
  return window.localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light'
}

export const theme = ref<AppTheme>(storedTheme())

export function setTheme(nextTheme: AppTheme): void {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  window.localStorage.setItem(themeKey, nextTheme)
}

setTheme(theme.value)
