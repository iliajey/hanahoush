import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { queryConfig } from "../../config/query.config"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: queryConfig.staleTime,
      refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
      retry: queryConfig.retry,
      retryDelay: queryConfig.retryDelay,
      gcTime: queryConfig.gcTime,
    },
  },
})

export default function QueryProvider({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
