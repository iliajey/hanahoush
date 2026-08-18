import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { RequireAnyPermission, RequirePermission, RequireRole, RequireStaff } from "../guards"
import { PERMISSIONS } from "../permissions"
import { roleUsers } from "./fixtures"

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
          <Route path="/unauthorized" element={<div>unauthorized page</div>} />
          <Route path="/session-expired" element={<div>session expired page</div>} />
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("RequirePermission", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("renders children when the permission is granted", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.EDITOR })
    renderAt("/protected", <RequirePermission permissions={[PERMISSIONS.EDITORIAL_VIEW]}>editorial content</RequirePermission>)
    expect(screen.getByText("editorial content")).toBeInTheDocument()
  })

  it("redirects authenticated users to /unauthorized when the permission is missing", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.VIEWER })
    renderAt("/protected", <RequirePermission permissions={[PERMISSIONS.EDITORIAL_MANAGE]}>manage content</RequirePermission>)
    expect(screen.getByText("unauthorized page")).toBeInTheDocument()
  })

  it("redirects guests to /login", () => {
    mockUseUser.mockReturnValue({ status: "guest", user: null })
    renderAt("/protected", <RequirePermission permissions={[PERMISSIONS.EDITORIAL_VIEW]}>content</RequirePermission>)
    expect(screen.getByText("login page")).toBeInTheDocument()
  })

  it("redirects to /session-expired when the session expired", () => {
    mockUseUser.mockReturnValue({ status: "session-expired", user: null })
    renderAt("/protected", <RequirePermission permissions={[PERMISSIONS.EDITORIAL_VIEW]}>content</RequirePermission>)
    expect(screen.getByText("session expired page")).toBeInTheDocument()
  })
})

describe("RequireAnyPermission", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("renders when any permission matches", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.CONTENT_MANAGER })
    renderAt(
      "/protected",
      <RequireAnyPermission permissions={[PERMISSIONS.MEDIA_UPLOAD, PERMISSIONS.MEDIA_MANAGE]}>media content</RequireAnyPermission>,
    )
    expect(screen.getByText("media content")).toBeInTheDocument()
  })

  it("denies staff-only content workspace to non-staff EDITOR despite articles.view", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.EDITOR })
    renderAt(
      "/protected",
      <RequireAnyPermission permissions={[PERMISSIONS.ARTICLES_VIEW]} staffOnly>articles workspace</RequireAnyPermission>,
    )
    expect(screen.getByText("unauthorized page")).toBeInTheDocument()
  })
})

describe("RequireStaff", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("renders for a staff user", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.CONTENT_MANAGER })
    renderAt("/protected", <RequireStaff>staff content</RequireStaff>)
    expect(screen.getByText("staff content")).toBeInTheDocument()
  })

  it("denies non-staff roles", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.VIEWER })
    renderAt("/protected", <RequireStaff>staff content</RequireStaff>)
    expect(screen.getByText("unauthorized page")).toBeInTheDocument()
  })
})

describe("RequireRole", () => {
  beforeEach(() => mockUseUser.mockReset())

  it("renders when the user holds one of the roles", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.PROJECT_MANAGER })
    renderAt("/protected", <RequireRole roles={["PROJECT_MANAGER", "UNKNOWN"]}>project content</RequireRole>)
    expect(screen.getByText("project content")).toBeInTheDocument()
  })

  it("denies when the user holds none of the roles", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.EDITOR })
    renderAt("/protected", <RequireRole roles={["SUPER_ADMIN"]}>admin content</RequireRole>)
    expect(screen.getByText("unauthorized page")).toBeInTheDocument()
  })
})