import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import type { ReactElement, ReactNode } from "react"

import LanguageProvider from "@/app/language/LanguageProvider"

/** Test harness wrapping a component with the providers it needs. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>{ui}</LanguageProvider>
      </QueryClientProvider>
    </BrowserRouter>,
  )
}

/** Shared QueryClient + providers for renderHook-style tests. */
export function createTestProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  )
  return { queryClient, wrapper }
}
