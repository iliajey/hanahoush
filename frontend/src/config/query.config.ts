export const queryConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false,
  retry: 1,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
} as const
