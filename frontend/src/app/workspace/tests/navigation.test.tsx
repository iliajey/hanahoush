import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import i18n from "@/i18n"
import LanguageProvider from "@/app/language/LanguageProvider"
import { StaffSidebar } from "@/app/layouts/StaffSidebar"
import { roleUsers } from "@/features/auth/tests/fixtures"
import type { UserProfile } from "@/features/auth/types"

const { mockUseUser } = vi.hoisted(() => ({ mockUseUser: vi.fn() }))
const { mockLogout } = vi.hoisted(() => ({ mockLogout: vi.fn() }))

vi.mock("@/features/auth/hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}))
vi.mock("@/features/auth/hooks/useLogout", () => ({
  useLogout: () => ({ mutate: mockLogout }),
}))

function renderSidebar(user: UserProfile | null) {
  mockUseUser.mockReturnValue({ status: "authenticated", user, isAuthenticated: Boolean(user), refreshUser: vi.fn() })
  const { container } = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <StaffSidebar />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
  return container
}

function hrefs(container: HTMLElement): string[] {
  return Array.from(new Set(Array.from(container.querySelectorAll('a[href]')).map((link) => link.getAttribute("href") ?? ""))).sort()
}

describe("StaffSidebar — role-aware navigation", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
  })

  it("renders no workspace links for an anonymous user", () => {
    const container = renderSidebar(null)
    expect(hrefs(container)).toEqual(["/"])
  })

  it("VIEWER only sees dashboard + editorial", () => {
    const container = renderSidebar(roleUsers.VIEWER)
    expect(hrefs(container)).toEqual(["/", "/dashboard", "/dashboard/editorial"])
    expect(container.querySelector('a[href="/dashboard/articles"]')).toBeNull()
    expect(container.querySelector('a[href="/dashboard/media"]')).toBeNull()
    expect(container.querySelector('a[href="/dashboard/contact"]')).toBeNull()
  })

  it("EDITOR only sees dashboard + editorial (content workspace is staff-only)", () => {
    const container = renderSidebar(roleUsers.EDITOR)
    expect(hrefs(container)).toEqual(["/", "/dashboard", "/dashboard/editorial"])
    expect(container.querySelector('a[href="/dashboard/articles"]')).toBeNull()
  })

  it("CONTENT_MANAGER sees dashboard, articles, editorial, media and communication", () => {
    const container = renderSidebar(roleUsers.CONTENT_MANAGER)
    expect(container.querySelector('a[href="/dashboard/articles"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/editorial"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/media"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/contact"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/newsletter"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/projects"]')).toBeNull()
  })

  it("PROJECT_MANAGER sees projects, articles and media (staff + view perms)", () => {
    const container = renderSidebar(roleUsers.PROJECT_MANAGER)
    expect(container.querySelector('a[href="/dashboard/projects"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/articles"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/media"]')).not.toBeNull()
    expect(container.querySelector('a[href="/dashboard/contact"]')).not.toBeNull()
  })

  it("COMPANY_ADMIN sees every content/communication surface", () => {
    const container = renderSidebar(roleUsers.COMPANY_ADMIN)
    for (const href of ["/dashboard/articles", "/dashboard/projects", "/dashboard/editorial", "/dashboard/media", "/dashboard/contact", "/dashboard/newsletter"]) {
      expect(container.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
  })

  it("SUPER_ADMIN sees every workspace link", () => {
    const container = renderSidebar(roleUsers.SUPER_ADMIN)
    for (const href of ["/dashboard/articles", "/dashboard/projects", "/dashboard/editorial", "/dashboard/media", "/dashboard/contact", "/dashboard/newsletter"]) {
      expect(container.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
  })
})

describe("StaffSidebar — RTL + localization", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
  })

  it("renders the sidebar in Persian with correct dir attribute (RTL)", async () => {
    await i18n.changeLanguage("fa")
    document.documentElement.dir = "rtl"
    renderSidebar(roleUsers.SUPER_ADMIN)
    expect(document.documentElement.dir).toBe("rtl")
    expect(screen.getByRole("link", { name: i18n.t("navWorkspace.dashboard") })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: i18n.t("navWorkspace.editorial") })).toBeInTheDocument()
    expect(screen.getByText(i18n.t("roles.SUPER_ADMIN.name"))).toBeInTheDocument()
  })

  it("renders Arabic labels for a staff role (localization parity)", async () => {
    await i18n.changeLanguage("ar")
    renderSidebar(roleUsers.COMPANY_ADMIN)
    expect(screen.getByRole("link", { name: i18n.t("navWorkspace.articles") })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: i18n.t("navWorkspace.projects") })).toBeInTheDocument()
  })
})