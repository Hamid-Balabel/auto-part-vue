<script setup lang="ts">
import { Check, ChevronDown, LoaderCircle, Search, X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type SelectValue = string | number
export interface BaseSelectOption<T extends SelectValue = SelectValue> {
  label: string
  value: T
  description?: string
  meta?: string
  icon?: string
  searchText?: string
  disabled?: boolean
  depth?: number
}

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: SelectValue | SelectValue[] | null | undefined
  options: unknown[]
  labelKey?: string
  valueKey?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  searchable?: boolean
  multiple?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  error?: string
  help?: string
  required?: boolean
  dataTestid?: string
}>(), {
  labelKey: 'label',
  valueKey: 'value',
  searchable: false,
  multiple: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue | SelectValue[] | null]
  search: [query: string]
}>()

const { locale, t } = useI18n()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const popup = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const popupStyle = ref<Record<string, string>>({})
const direction = computed(() => locale.value.startsWith('ar') ? 'rtl' : 'ltr')

const normalizedOptions = computed<BaseSelectOption[]>(() => props.options.map((raw) => {
  const option = raw as Record<string, unknown>
  return {
    label: String(option[props.labelKey] ?? ''),
    value: option[props.valueKey] as SelectValue,
    description: option.description ? String(option.description) : undefined,
    meta: option.meta ? String(option.meta) : undefined,
    icon: option.icon ? String(option.icon) : undefined,
    searchText: option.searchText ? String(option.searchText) : undefined,
    disabled: Boolean(option.disabled),
    depth: Number.isFinite(option.depth) && (option.depth as number) >= 0 ? (option.depth as number) : 0,
  }
}))
const selectedValues = computed<SelectValue[]>(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue === null || props.modelValue === undefined || Array.isArray(props.modelValue) ? [] : [props.modelValue]
})
const isSelected = (value: SelectValue) => selectedValues.value.some((selected) => String(selected) === String(value))
const selectedOptions = computed(() => normalizedOptions.value.filter((option) => isSelected(option.value)))
const filteredOptions = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  if (!normalizedQuery) return normalizedOptions.value
  return normalizedOptions.value.filter((option) => [option.label, option.description, option.meta, option.searchText]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery)))
})
const displayValue = computed(() => props.multiple
  ? selectedOptions.value.map((option) => option.label).join(', ')
  : selectedOptions.value[0]?.label)
const effectivePlaceholder = computed(() => props.placeholder || t('common.select'))
const effectiveSearchPlaceholder = computed(() => props.searchPlaceholder || t('crud.searchSelect', { label: props.label }))
const effectiveEmptyText = computed(() => props.emptyText || t('states.emptyTitle'))

async function openDropdown() {
  if (props.disabled || props.loading || open.value) return
  open.value = true
  activeIndex.value = Math.max(0, filteredOptions.value.findIndex((option) => isSelected(option.value)))
  window.addEventListener('resize', positionPopup)
  window.addEventListener('scroll', positionPopup, true)
  await nextTick()
  positionPopup()
  await nextTick()
  if (props.searchable) searchInput.value?.focus({ preventScroll: true })
  else popup.value?.focus({ preventScroll: true })
}

function closeDropdown(restoreFocus = false) {
  if (!open.value) return
  open.value = false
  query.value = ''
  activeIndex.value = -1
  window.removeEventListener('resize', positionPopup)
  window.removeEventListener('scroll', positionPopup, true)
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

function positionPopup() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const gap = 8
  const viewportPadding = 12
  const availableBelow = window.innerHeight - rect.bottom - viewportPadding - gap
  const availableAbove = rect.top - viewportPadding - gap
  const placeAbove = availableBelow < 220 && availableAbove > availableBelow
  const maxHeight = Math.max(140, Math.min(320, placeAbove ? availableAbove : availableBelow))
  popupStyle.value = {
    position: 'fixed',
    zIndex: '9999',
    width: `${Math.min(rect.width, window.innerWidth - viewportPadding * 2)}px`,
    left: `${Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - rect.width - viewportPadding))}px`,
    ...(placeAbove ? { bottom: `${window.innerHeight - rect.top + gap}px` } : { top: `${rect.bottom + gap}px` }),
    maxHeight: `${maxHeight}px`,
  }
}

function selectOption(option: BaseSelectOption) {
  if (option.disabled) return
  if (props.multiple) {
    const next = isSelected(option.value)
      ? selectedValues.value.filter((value) => String(value) !== String(option.value))
      : [...selectedValues.value, option.value]
    emit('update:modelValue', next)
    return
  }
  emit('update:modelValue', option.value)
  closeDropdown(true)
}

function clearSelection() {
  emit('update:modelValue', props.multiple ? [] : null)
}

function moveActive(direction: 1 | -1) {
  if (!open.value) {
    openDropdown()
    return
  }
  if (!filteredOptions.value.length) return
  let next = activeIndex.value
  do next = (next + direction + filteredOptions.value.length) % filteredOptions.value.length
  while (filteredOptions.value[next]?.disabled && next !== activeIndex.value)
  activeIndex.value = next
  nextTick(() => document.getElementById(`${props.id}-option-${next}`)?.scrollIntoView({ block: 'nearest' }))
}

function selectActive() {
  const option = filteredOptions.value[activeIndex.value]
  if (option) selectOption(option)
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (!root.value?.contains(target) && !popup.value?.contains(target)) closeDropdown()
}

watch(query, (value) => {
  activeIndex.value = filteredOptions.value.length ? 0 : -1
  emit('search', value)
})
watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})
watch(() => props.disabled, (value) => { if (value) closeDropdown() })

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', positionPopup)
  window.removeEventListener('scroll', positionPopup, true)
})
</script>

<template>
  <div ref="root" :data-testid="dataTestid">
    <label class="block" :for="id">
      <span class="form-label">{{ label }} <span v-if="required" class="text-danger">*</span></span>
    </label>
    <div class="relative mt-1.5">
      <button
        :id="id"
        ref="trigger"
        class="select-control flex min-h-11 items-center gap-2 text-start transition"
        :class="[error ? 'border-danger focus:border-danger focus:ring-danger' : '', disabled ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : 'hover:border-primary/60', clearable && selectedValues.length ? 'pe-16' : '']"
        type="button"
        role="combobox"
        :disabled="disabled || loading"
        :aria-expanded="open"
        :aria-controls="`${id}-listbox`"
        :aria-haspopup="'listbox'"
        :aria-required="required || undefined"
        :aria-activedescendant="open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="error ? `${id}-error` : help ? `${id}-help` : undefined"
        @click="open ? closeDropdown() : openDropdown()"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter.prevent="open ? selectActive() : openDropdown()"
        @keydown.space.prevent="open ? selectActive() : openDropdown()"
        @keydown.escape.prevent="closeDropdown(true)"
      >
        <span v-if="displayValue" class="min-w-0 flex-1 truncate font-medium text-text">{{ displayValue }}</span>
        <span v-else class="min-w-0 flex-1 truncate text-text-muted">{{ loading ? t('states.loading') : effectivePlaceholder }}</span>
        <LoaderCircle v-if="loading" class="size-4 shrink-0 animate-spin text-primary" />
        <ChevronDown v-else class="size-4 shrink-0 text-text-muted transition-transform duration-200" :class="open ? 'rotate-180' : ''" />
      </button>
      <button
        v-if="clearable && selectedValues.length && !disabled"
        class="absolute end-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted transition hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        type="button"
        :aria-label="t('actions.clear')"
        @click="clearSelection"
      >
        <X class="size-4" />
      </button>
    </div>

    <span v-if="help && !error" :id="`${id}-help`" class="mt-1.5 block text-xs text-text-muted">{{ help }}</span>
    <span v-if="error" :id="`${id}-error`" class="form-error">{{ error }}</span>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="translate-y-1 scale-[0.98] opacity-0"
        enter-to-class="translate-y-0 scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="translate-y-0 scale-100 opacity-100"
        leave-to-class="translate-y-1 scale-[0.98] opacity-0"
        @after-enter="positionPopup"
      >
        <div
          v-if="open"
          :id="`${id}-listbox`"
          ref="popup"
          class="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-2 shadow-elevated"
          :style="popupStyle"
          :dir="direction"
          role="listbox"
          :aria-multiselectable="multiple || undefined"
          tabindex="-1"
          @keydown.down.prevent="moveActive(1)"
          @keydown.up.prevent="moveActive(-1)"
          @keydown.enter.prevent="selectActive"
          @keydown.space.prevent="selectActive"
          @keydown.escape.prevent="closeDropdown(true)"
        >
          <label v-if="searchable" class="relative mb-2 block shrink-0">
            <Search class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input
              ref="searchInput"
              v-model="query"
              class="form-control ps-9"
              type="search"
              :placeholder="effectiveSearchPlaceholder"
              autocomplete="off"
              @keydown.down.stop.prevent="moveActive(1)"
              @keydown.up.stop.prevent="moveActive(-1)"
              @keydown.enter.stop.prevent="selectActive"
              @keydown.escape.stop.prevent="closeDropdown(true)"
            />
          </label>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div v-if="loading" class="flex items-center justify-center gap-2 px-3 py-6 text-sm text-text-muted">
              <LoaderCircle class="size-4 animate-spin" /> {{ t('states.loading') }}
            </div>
            <div v-else-if="!filteredOptions.length" class="px-3 py-6 text-center text-sm text-text-muted">{{ effectiveEmptyText }}</div>
            <button
              v-for="(option, index) in filteredOptions"
              v-else
              :id="`${id}-option-${index}`"
              :key="`${String(option.value)}-${index}`"
              class="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-start text-sm transition"
              :class="[
                isSelected(option.value) ? 'bg-primary-soft text-primary' : 'text-text hover:bg-primary-soft/60',
                activeIndex === index ? 'ring-1 ring-inset ring-primary/40' : '',
                option.disabled ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : '',
              ]"
              type="button"
              role="option"
              :aria-selected="isSelected(option.value)"
              :disabled="option.disabled"
              @mouseenter="activeIndex = index"
              @click="selectOption(option)"
            >
              <span v-if="option.icon" class="shrink-0">{{ option.icon }}</span>
              <span class="min-w-0 flex-1" :style="option.depth ? { paddingInlineStart: `${option.depth * 1.125}rem` } : undefined">
                <span class="block truncate font-semibold">{{ option.label }} <span v-if="option.meta" class="font-normal text-text-muted">{{ option.meta }}</span></span>
                <span v-if="option.description" class="block truncate text-xs text-text-muted">{{ option.description }}</span>
              </span>
              <Check v-if="isSelected(option.value)" class="size-4 shrink-0" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
