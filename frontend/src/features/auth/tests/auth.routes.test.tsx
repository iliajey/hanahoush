import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ProtectedRoute } from "../components/ProtectedRoute"
import { GuestRoute } from "../components/GuestRoute"

const { mockUseUser } = vi.hoisted(() => ({ mockUseUser: vi.fn() }))

vi.mock("../hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}))

function renderAt(initialPath: string, children: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/dashboard" element={<div>dashboard page</div>} />
          <Route path="/session-expired" element={<div>session expired page</div>} />
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("ProtectedRoute", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("renders children when authenticated", () => {
    mockUseUser.mockReturnValue({ status: "authenticated" })
    renderAt("/protected", <ProtectedRoute>protected content</ProtectedRoute>)
    expect(screen.getByText("protected content")).toBeInTheDocument()
  })

  it("redirects guests to /login", () => {
    mockUseUser.mockReturnValue({ status: "guest" })
    renderAt("/protected", <ProtectedRoute>protected content</ProtectedRoute>)
    expect(screen.getByText("login page")).toBeInTheDocument()
  })

  it("redirects to /session-expired when the session expired", () => {
    mockUseUser.mockReturnValue({ status: "session-expired" })
    renderAt("/protected", <ProtectedRoute>protected content</ProtectedRoute>)
    expect(screen.getByText("session expired page")).toBeInTheDocument()
  })
})

describe("GuestRoute", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("renders children for guests", () => {
    mockUseUser.mockReturnValue({ status: "guest" })
    renderAt("/guest", <GuestRoute>login form</GuestRoute>)
    expect(screen.getByText("login form")).toBeInTheDocument()
  })

  it("redirects authenticated users to /dashboard", () => {
    mockUseUser.mockReturnValue({ status: "authenticated" })
    renderAt("/guest", <GuestRoute>login form</GuestRoute>)
    expect(screen.getByText("dashboard page")).toBeInTheDocument()
  })
})
