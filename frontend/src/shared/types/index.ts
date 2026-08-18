export interface ApiError {
  code?: string
  message: string
  errors?: unknown
}

export interface PaginatedResult<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
