export interface ApiEnvelope<T> {
  status: boolean
  code?: number
  message?: string
  data: T
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface Paginated<T> extends PaginationMeta {
  data: T[]
}

export interface ApiErrorPayload {
  message: string
  errors?: Record<string, string[]>
  status?: boolean
  code?: number
}

export interface ListQuery {
  page?: number
  per_page?: number
  sort_column?: string
  sort_direction?: 'asc' | 'desc'
  search?: string
  is_active?: boolean | number | string
  is_trashed?: boolean | number | string
}
