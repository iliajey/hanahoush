import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"

import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"
import { roleUsers } from "@/features/auth/tests/fixtures"
import type { OperationalDashboard } from "../types"
import { DashboardPage } from "../pages/DashboardPage"

const { mockUseUser, mockOpDashboard, mockLogout } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockOpDashboard: vi.fn(),
  mockLogout: vi.fn(),
}))

vi.mock("@/features/auth/hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}))
vi.mock("@/features/auth/hooks/useLogout", () => ({
  useLogout: () => ({ mutate: mockLogout }),
}))
vi.mock("@/features/dashboard/hooks", () => ({
  useOperationalDashboard: () => mockOpDashboard(),
}))

const payload: OperationalDashboard = {
  content: {
    articles_published: 4,
    articles_drafts: 2,
    articles_awaiting_review: 1,
    articles_scheduled: 1,
    projects_published: 9,
    projects_drafts: 3,
    services: 6,
  },
  editorial: {
    pending_approvals: 2,
    rejected_approvals: 1,
    scheduled_publications: 2,
    active_locks: 1,
    recent_revisions: 7,
  },
  engagement: {
    page_views: 1200,
    page_views_30d: 300,
    article_views: 180,
    project_views: 240,
    contact_requests: 5,
    newsletter_subscriptions: 40,
    search_activity: 33,
  },
  operations: {
    recent_contact_requests: [{ id: 1, name: "Alice", email: "alice@example.com", subject: "Hi", status: "new", created_at: "" }],
    recent_editorial_activity: [{ id: 1, action: "workflow.transition", details: "", created_at: "" }],
    recent_media_uploads: [{ id: 1, original_name: "hero.png", mime_type: "image/png", size: 10, created_at: "" }],
    recent_admin_actions: [],
  },
  system: {
    database: { status: "healthy" },
    cache: { status: "healthy" },
    migrations: { status: "ok", pending: 0 },
    environment: "test",
    version: "0.1.0",
    debug: true,
  },
  generated_at: new Date().toISOString(),
}

describe("DashboardPage — role-aware rendering", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockOpDashboard.mockReturnValue({ data: payload, isLoading: false, isError: false, refetch: vi.fn() })
  })

  it("CONTENT_MANAGER gets the content workspace with staff widgets and no project tiles", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.CONTENT_MANAGER, isAuthenticated: true, refreshUser: vi.fn() })
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText("Content workspace")).toBeInTheDocument()
    expect(screen.getByText("Published articles")).toBeInTheDocument()
    expect(screen.queryByText("Published projects")).toBeNull()
    expect(screen.getByText("Pending approvals")).toBeInTheDocument()
    expect(screen.queryByText("Read-only overview")).toBeNull()
  })

  it("SUPER_ADMIN sees the full operational dashboard including project + system tiles", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.SUPER_ADMIN, isAuthenticated: true, refreshUser: vi.fn() })
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText("Operations centre")).toBeInTheDocument()
    expect(screen.getByText("Published articles")).toBeInTheDocument()
    expect(screen.getByText("Published projects")).toBeInTheDocument()
    expect(screen.getByText("Open contact requests")).toBeInTheDocument()
    expect(screen.getByText("Database")).toBeInTheDocument()
    expect(screen.getByText("Operations")).toBeInTheDocument()
  })

  it("EDITOR falls back to the role-aware editorial overview (no staff API data)", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.EDITOR, isAuthenticated: true, refreshUser: vi.fn() })
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole("heading", { name: "Editorial workspace" })).toBeInTheDocument()
    expect(screen.getByText("Read-only overview")).toBeInTheDocument()
    expect(screen.queryByText("Published articles")).toBeNull()
    expect(screen.getByRole("link", { name: "Editorial workspace" })).toBeInTheDocument()
  })

  it("VIEWER sees only the read-only overview with no management actions", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.VIEWER, isAuthenticated: true, refreshUser: vi.fn() })
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Read-only overview")).toBeInTheDocument()
    expect(screen.getByText("Articles")).toBeInTheDocument()
    expect(screen.queryByText("Pending approvals")).toBeNull()
  })

  it("PROJECT_MANAGER sees project tiles (and articles, which their role may view)", () => {
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.PROJECT_MANAGER, isAuthenticated: true, refreshUser: vi.fn() })
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText("Project workspace")).toBeInTheDocument()
    expect(screen.getByText("Published projects")).toBeInTheDocument()
    // PROJECT_MANAGER is staff with articles.view → article tiles render.
    expect(screen.getByText("Published articles")).toBeInTheDocument()
    // No editorial management numbers for this role (editorial section is view-only).
    expect(screen.getByText("Pending approvals")).toBeInTheDocument()
  })
})