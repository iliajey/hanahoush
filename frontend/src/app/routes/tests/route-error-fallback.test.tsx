import { describe, expect, it, vi, beforeEach } from "vitest"
import { BrowserRouter } from "react-router-dom"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as RouterModule from "react-router-dom"

import { RouteErrorFallback } from "@/app/routes/RouteErrorFallback"
import LanguageProvider from "@/app/language/LanguageProvider"

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    useRouteError: () => errorMock,
    isRouteErrorResponse: (error: unknown) => error instanceof Response,
  }
})

let errorMock: unknown = new Error("kaboom")

function renderFallback() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <RouteErrorFallback />
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe("RouteErrorFallback", () => {
  beforeEach(() => {
    errorMock = new Error("kaboom")
  })

  it("renders a polished 404 fallback for not-found route errors", () => {
    errorMock = new Response("Not found", { status: 404 })
    renderFallback()
    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/")
  })

  it("renders a generic fallback for unexpected errors", () => {
    renderFallback()
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /unexpected error/i })).toBeInTheDocument()
  })
})