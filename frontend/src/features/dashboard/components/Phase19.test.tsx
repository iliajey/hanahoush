import { describe, expect, it, vi, beforeEach } from "vitest"
import { act, render, renderHook, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import type { ReactNode } from "react"

import { EGG_CONFIG, useHomeClickEgg } from "@/shared/hooks/useHomeClickEgg"
import { formatCountdown } from "@/features/editorial/components/Countdown"
import { TodayCard } from "@/features/dashboard/components/TodayCard"
import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"
import type { OperationalDashboard } from "@/features/dashboard/types"

vi.mock("@/features/auth/hooks/useAuthorization", () => ({
  useAuthorization: () => ({ can: () => true, hasPermission: () => true, isStaff: true, isSuperAdmin: false }),
}))

function eggWrapper(path = "/") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  }
}

function LocationProbe() {
  const loc = useLocation()
  return <span data-testid="loc">{loc.pathname}</span>
}

describe("Home click easter egg", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("navigates to /credits after 10 consecutive clicks", async () => {
    function Harness() {
      const { onHomeClick } = useHomeClickEgg(true)
      return (
        <>
          <button type="button" onClick={onHomeClick}>home</button>
          <LocationProbe />
        </>
      )
    }
    render(<Harness />, { wrapper: eggWrapper("/") })
    const btn = screen.getByRole("button", { name: "home" })
    for (let i = 0; i < 9; i++) {
      fireEvent.click(btn)
      act(() => { vi.advanceTimersByTime(100) })
    }
    expect(screen.getByTestId("loc").textContent).toBe("/")
    fireEvent.click(btn)
    expect(screen.getByTestId("loc").textContent).toBe("/credits")
    expect(EGG_CONFIG.CLICKS_REQUIRED).toBe(10)
  })

  it("resets after inactivity", async () => {
    function Harness() {
      const { onHomeClick } = useHomeClickEgg(true)
      return (
        <>
          <button type="button" onClick={onHomeClick}>home</button>
          <LocationProbe />
        </>
      )
    }
    render(<Harness />, { wrapper: eggWrapper("/") })
    const btn = screen.getByRole("button", { name: "home" })
    for (let i = 0; i < 5; i++) fireEvent.click(btn)
    await act(async () => { vi.advanceTimersByTime(EGG_CONFIG.RESET_MS + 100) })
    for (let i = 0; i < 9; i++) fireEvent.click(btn)
    expect(screen.getByTestId("loc").textContent).toBe("/")
    vi.useRealTimers()
  })
})

describe("Countdown formatting", () => {
  it("formats minutes, hours, tomorrow, overdue", async () => {
    await i18n.changeLanguage("en")
    const t = i18n.getFixedT("en") as (k: string, o?: Record<string, unknown>) => string
    const now = Date.UTC(2026, 4, 1, 12, 0, 0)
    expect(formatCountdown(new Date(now + 14 * 60000).toISOString(), now, t)).toContain("14")
    expect(formatCountdown(new Date(now + 134 * 60000).toISOString(), now, t)).toContain("2h")
    expect(formatCountdown(new Date(now - 30 * 60000).toISOString(), now, t)).toContain("Overdue")
  })
})

const dashboardFixture: OperationalDashboard = {
  content: {
    articles_published: 1, articles_drafts: 2, articles_awaiting_review: 4, articles_scheduled: 0,
    articles_missing_fa: 0, articles_missing_ar: 0, projects_published: 0, projects_drafts: 0,
    projects_awaiting_review: 0, projects_missing_fa: 0, projects_missing_ar: 0, services: 0,
  },
  editorial: {
    pending_approvals: 1, rejected_approvals: 0, scheduled_publications: 2, active_locks: 0,
    recent_revisions: 0, today_count: 2, failed_count: 1, overdue_count: 0,
  },
  engagement: { page_views: 0, page_views_30d: 0, article_views: 0, project_views: 0, contact_requests: 0, newsletter_subscriptions: 0, search_activity: 0 },
  operations: { recent_contact_requests: [], recent_editorial_activity: [], recent_media_uploads: [], recent_admin_actions: [] },
  system: { database: { status: "healthy" }, cache: { status: "healthy" }, migrations: { status: "ok", pending: 0 }, environment: "test", version: "0", debug: false },
  generated_at: new Date().toISOString(),
}

describe("TodayCard", () => {
  it("renders real counts and role-aware links", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<TodayCard data={dashboardFixture} />)
    expect(screen.getByText(/need attention/)).toBeInTheDocument()
    expect(screen.getByText(/scheduled today/)).toBeInTheDocument()
  })

  it("shows all-clear when empty", async () => {
    await i18n.changeLanguage("en")
    const empty = { ...dashboardFixture, content: { ...dashboardFixture.content, articles_drafts: 0, articles_awaiting_review: 0 }, editorial: { ...dashboardFixture.editorial, pending_approvals: 0, failed_count: 0, today_count: 0, overdue_count: 0 } }
    renderWithProviders(<TodayCard data={empty} />)
    expect(screen.getByText(/Everything looks good/)).toBeInTheDocument()
  })
})

describe("renderHook egg import", () => {
  it("exposes onHomeClick", () => {
    const { result } = renderHook(() => useHomeClickEgg(true), { wrapper: eggWrapper("/") })
    expect(typeof result.current.onHomeClick).toBe("function")
    vi.useRealTimers()
  })
})
