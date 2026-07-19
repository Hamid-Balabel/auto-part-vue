<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  to?: RouteLocationRaw
  href?: string
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  ariaLabel?: string
  title?: string
  dataTestid?: string
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const classes = computed(() => [
  props.variant === 'primary' && 'btn-primary',
  props.variant === 'secondary' && 'btn-secondary',
  props.variant === 'outline' && 'btn-outline',
  props.variant === 'ghost' && 'btn-ghost',
  props.variant === 'danger' && 'btn-danger',
  props.variant === 'link' && 'btn-link',
  props.size === 'sm' && props.variant !== 'link' && 'btn-sm',
  props.size === 'lg' && props.variant !== 'link' && 'btn-lg',
  props.fullWidth && 'w-full',
])
</script>

<template>
  <RouterLink
    v-if="props.to"
    :class="classes"
    :to="props.to"
    :aria-disabled="props.disabled || props.loading ? 'true' : undefined"
    :aria-label="props.ariaLabel"
    :title="props.title"
    :data-testid="props.dataTestid"
  >
    <span v-if="props.loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
    <slot />
  </RouterLink>
  <a
    v-else-if="props.href"
    :class="classes"
    :href="props.href"
    :aria-disabled="props.disabled || props.loading ? 'true' : undefined"
    :aria-label="props.ariaLabel"
    :title="props.title"
    :data-testid="props.dataTestid"
  >
    <span v-if="props.loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
    <slot />
  </a>
  <button
    v-else
    :class="classes"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-label="props.ariaLabel"
    :title="props.title"
    :data-testid="props.dataTestid"
  >
    <span v-if="props.loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
    <slot />
  </button>
</template>
