import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { RequireSuperAdmin } from "@/features/auth/guards"
import { roleUsers, superuserAdmin } from "@/features/auth/tests/fixtures"

const { mockUseUser } = vi.hoisted(() => ({ mockUseUser: vi.fn() }))

vi.mock("@/features/auth/hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}))

function renderAt(initialPath: string, children: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/unauthorized" element={<div>unauthorized page</div>} />
          <Route path="/session-expired" element={<div>session expired page</div>} />
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("user admin route guards (/dashboard/users/*)", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("lets SUPER_ADMIN through to user management", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.SUPER_ADMIN })
    renderAt(
      "/dashboard/users/new",
      <RequireSuperAdmin>create user page</RequireSuperAdmin>,
    )
    expect(screen.getByText("create user page")).toBeInTheDocument()
  })

  it("lets the Django superuser through to user management", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: superuserAdmin })
    renderAt(
      "/dashboard/users/1",
      <RequireSuperAdmin>user detail page</RequireSuperAdmin>,
    )
    expect(screen.getByText("user detail page")).toBeInTheDocument()
  })

  it("blocks COMPANY_ADMIN, EDITOR and VIEWER from user management", () => {
    for (const user of [roleUsers.COMPANY_ADMIN, roleUsers.EDITOR, roleUsers.VIEWER]) {
      mockUseUser.mockReturnValue({ status: "authenticated", user })
      const { unmount } = renderAt(
        "/dashboard/users/1/edit",
        <RequireSuperAdmin>user edit page</RequireSuperAdmin>,
      )
      expect(screen.getByText("unauthorized page")).toBeInTheDocument()
      unmount()
    }
  })

  it("sends guests to /login", () => {
    mockUseUser.mockReturnValue({ status: "guest", user: null })
    renderAt(
      "/dashboard/users",
      <RequireSuperAdmin>users page</RequireSuperAdmin>,
    )
    expect(screen.getByText("login page")).toBeInTheDocument()
  })
})
