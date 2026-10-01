import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ListQuery, Paginated } from '@/types/api'

interface UseCrudListOptions<T> {
  list: (query: ListQuery) => Promise<Paginated<T> | T[]>
  perPage?: number
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
}

export function useCrudList<T>(options: UseCrudListOptions<T>) {
  const { locale } = useI18n()
  const loading = ref(false)
  const mutating = ref(false)
  const page = ref(1)
  const search = ref('')
  const sortColumn = ref(options.defaultSortColumn ?? 'id')
  const sortDirection = ref<'asc' | 'desc'>(options.defaultSortDirection ?? 'desc')
  const pageData = ref<Paginated<T> | null>(null)
  const rows = ref<T[]>([])
  let requestId = 0

  const query = computed<ListQuery>(() => ({
    page: page.value,
    per_page: options.perPage ?? 15,
    sort_column: sortColumn.value,
    sort_direction: sortDirection.value,
    ...(search.value.trim() ? { search: search.value.trim() } : {}),
  }))

  async function load() {
    const currentRequest = ++requestId
    loading.value = true
    try {
      const response = await options.list(query.value)
      if (currentRequest !== requestId) return
      if (Array.isArray(response)) {
        rows.value = response
        pageData.value = null
      } else {
        rows.value = response.data
        pageData.value = response
      }
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  watch(locale, () => { void load() })

  function changePage(nextPage: number) {
    page.value = nextPage
    void load()
  }

  function applySearch(value: string) {
    search.value = value
    page.value = 1
    void load()
  }

  function clearSearch() {
    applySearch('')
  }

  function sortBy(column: string) {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = column
      sortDirection.value = 'asc'
    }
    page.value = 1
    void load()
  }

  async function mutate(action: () => Promise<void>) {
    mutating.value = true
    try {
      await action()
      await load()
    } finally {
      mutating.value = false
    }
  }

  return {
    loading,
    mutating,
    page,
    search,
    sortColumn,
    sortDirection,
    pageData,
    rows,
    query,
    load,
    changePage,
    applySearch,
    clearSearch,
    sortBy,
    mutate,
  }
}
