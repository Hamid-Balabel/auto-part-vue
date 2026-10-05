<script setup lang="ts">
import { Check, ChevronDown, LoaderCircle } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { categoryDisabledSet, categoryDisplayName, filterCategoryTreeRowsByCollapsed, flattenCategoryTree } from '../utils/categoryTree'
import type { CategoryTreeNode } from '../types'

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: number | null | undefined
  nodes: CategoryTreeNode[]
  currentId?: number | string | null
  placeholder?: string
  emptyText?: string
  loading?: boolean
  disabled?: boolean
  error?: string
  required?: boolean
  dataTestid?: string
}>(), {
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { locale, t } = useI18n()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const popup = ref<HTMLElement | null>(null)
const open = ref(false)
const collapsedIds = ref<Set<number>>(new Set())
const initializedCollapseKey = ref('')
const popupStyle = ref<Record<string, string>>({})

const direction = computed(() => locale.value.startsWith('ar') ? 'rtl' : 'ltr')
const isRtl = computed(() => direction.value === 'rtl')
const rows = computed(() => flattenCategoryTree(props.nodes, locale.value, t('dataEntry.rootCategory')))
const parentIds = computed(() => rows.value.filter((row) => row.hasChildren).map((row) => row.category.id))
const visibleRows = computed(() => filterCategoryTreeRowsByCollapsed(rows.value, collapsedIds.value))
const disabledIds = computed(() => categoryDisabledSet(props.nodes, props.currentId))
const selectedRow = computed(() => rows.value.find((row) => row.category.id === props.modelValue))
const selectedLabel = computed(() => selectedRow.value ? categoryDisplayName(selectedRow.value.category, locale.value) : '')
const selectedPath = computed(() => selectedRow.value?.path ?? '')
const effectivePlaceholder = computed(() => props.placeholder || t('common.select'))
const effectiveEmptyText = computed(() => props.emptyText || t('states.emptyTitle'))

function initializeCollapsedParents() {
  const key = parentIds.value.join(',')
  if (!key || initializedCollapseKey.value === key) return
  collapsedIds.value = new Set(parentIds.value)
  initializedCollapseKey.value = key
}

async function openDropdown() {
  if (props.disabled || props.loading || open.value) return
  open.value = true
  window.addEventListener('resize', positionPopup)
  window.addEventListener('scroll', positionPopup, true)
  await nextTick()
  positionPopup()
  await nextTick()
  popup.value?.focus({ preventScroll: true })
}

function closeDropdown(restoreFocus = false) {
  if (!open.value) return
  open.value = false
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
  const maxHeight = Math.max(160, Math.min(360, placeAbove ? availableAbove : availableBelow))
  const width = Math.min(Math.max(rect.width, 280), window.innerWidth - viewportPadding * 2)
  const left = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding))

  popupStyle.value = {
    position: 'fixed',
    zIndex: '9999',
    width: `${width}px`,
    left: `${left}px`,
    ...(placeAbove ? { bottom: `${window.innerHeight - rect.top + gap}px` } : { top: `${rect.bottom + gap}px` }),
    maxHeight: `${maxHeight}px`,
  }
}

function isCollapsed(id: number) {
  return collapsedIds.value.has(id)
}

function toggleRow(id: number) {
  const next = new Set(collapsedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedIds.value = next
  nextTick(positionPopup)
}

function selectCategory(id: number) {
  if (disabledIds.value.has(id)) return
  emit('update:modelValue', id)
  closeDropdown(true)
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (!root.value?.contains(target) && !popup.value?.contains(target)) closeDropdown()
}

watch(parentIds, initializeCollapsedParents, { immediate: true })
watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})
watch(() => props.disabled, (value) => { if (value) closeDropdown() })
watch(() => props.loading, (value) => { if (value) closeDropdown() })

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
        :class="[
          error ? 'border-danger focus:border-danger focus:ring-danger' : '',
          disabled ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : 'hover:border-primary/60',
        ]"
        type="button"
        :disabled="disabled || loading"
        :aria-expanded="open"
        :aria-controls="`${id}-tree`"
        :aria-required="required || undefined"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="error ? `${id}-error` : undefined"
        :title="selectedPath || effectivePlaceholder"
        @click="open ? closeDropdown() : openDropdown()"
        @keydown.enter.prevent="open ? closeDropdown(true) : openDropdown()"
        @keydown.space.prevent="open ? closeDropdown(true) : openDropdown()"
        @keydown.escape.prevent="closeDropdown(true)"
        @keydown.down.prevent="openDropdown()"
      >
        <span v-if="selectedLabel" class="min-w-0 flex-1">
          <span class="block truncate font-medium text-text">{{ selectedLabel }}</span>
          <span v-if="selectedPath && selectedPath !== selectedLabel" class="block truncate text-[0.6875rem] leading-4 text-text-muted">{{ selectedPath }}</span>
        </span>
        <span v-else class="min-w-0 flex-1 truncate text-text-muted">{{ loading ? t('states.loading') : effectivePlaceholder }}</span>
        <LoaderCircle v-if="loading" class="size-4 shrink-0 animate-spin text-primary" />
        <ChevronDown v-else class="size-4 shrink-0 text-text-muted transition-transform duration-200" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
      </button>
    </div>

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
          :id="`${id}-tree`"
          ref="popup"
          class="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-2 shadow-elevated"
          :style="popupStyle"
          :dir="direction"
          role="group"
          :aria-labelledby="id"
          tabindex="-1"
          @keydown.escape.prevent="closeDropdown(true)"
        >
          <div v-if="loading" class="flex items-center justify-center gap-2 px-3 py-6 text-sm text-text-muted">
            <LoaderCircle class="size-4 animate-spin" aria-hidden="true" /> {{ t('states.loading') }}
          </div>
          <div v-else-if="!rows.length" class="px-3 py-6 text-center text-sm text-text-muted">{{ effectiveEmptyText }}</div>
          <div v-else class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div
              v-for="row in visibleRows"
              :key="row.category.id"
              class="flex w-full items-stretch rounded-[var(--radius-md)] text-sm transition"
              :class="[
                modelValue === row.category.id ? 'bg-primary-soft text-primary' : 'text-text hover:bg-primary-soft/60',
                disabledIds.has(row.category.id) ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : '',
              ]"
              :style="row.depth ? { paddingInlineStart: `${row.depth * 1}rem` } : undefined"
            >
              <button
                v-if="row.hasChildren"
                class="my-1 ms-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                type="button"
                :aria-expanded="!isCollapsed(row.category.id)"
                :aria-label="isCollapsed(row.category.id) ? t('dataEntry.expandCategory') : t('dataEntry.collapseCategory')"
                @click.stop="toggleRow(row.category.id)"
              >
                <ChevronDown class="size-4 transition-transform duration-200" :class="isCollapsed(row.category.id) ? (isRtl ? '-rotate-90' : 'rotate-90') : ''" aria-hidden="true" />
              </button>
              <span v-else class="ms-1 inline-block size-7 shrink-0" aria-hidden="true"></span>
              <button
                class="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] px-2 py-2 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                type="button"
                :disabled="disabledIds.has(row.category.id)"
                :aria-disabled="disabledIds.has(row.category.id)"
                :aria-pressed="modelValue === row.category.id"
                :aria-current="modelValue === row.category.id ? 'true' : undefined"
                :title="row.path"
                @click="selectCategory(row.category.id)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-semibold">{{ categoryDisplayName(row.category, locale) }}</span>
                  <span v-if="row.path" class="block truncate text-[0.6875rem] leading-4 text-text-muted">{{ row.path }}</span>
                </span>
                <Check v-if="modelValue === row.category.id" class="size-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
