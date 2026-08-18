/** Shared API domain types. */

export interface ApiError {
  success: boolean
  message: string
  data: null
  errors: Record<string, string[]> | string[] | string | null
  request_id?: string | null
}

export interface ApiSuccess<T> {
  success: boolean
  message: string
  data: T
  errors: null
  request_id?: string | null
}

export interface PaginationMeta {
  count: number
  num_pages: number
  current_page: number
  page_size: number
  next: string | null
  previous: string | null
}

export interface PaginatedResponse<T> extends ApiSuccess<T[]> {
  pagination: PaginationMeta
}

export interface ApiEnvelope<T = unknown> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | string[] | string | null
  request_id?: string | null
  pagination?: PaginationMeta
}

export interface TokenRefreshEnvelope {
  access: string
  refresh?: string
}
