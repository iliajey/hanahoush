import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"

import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"

const { mockSchedules, mockCan, mockPage, mockCounts } = vi.hoisted(() => ({
  mockSchedules: vi.fn(),
  mockCan: vi.fn(),
  mockPage: vi.fn(),
  mockCounts: vi.fn(),
}))

vi.mock("../hooks", () => ({
  useSchedules: () => mockSchedules(),
  useSchedulePage: () => mockPage(),
  useScheduleCounts: () => mockCounts(),
  useCancelScheduleMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useRescheduleMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/auth/hooks/useAuthorization", () => ({ useAuthorization: () => ({ can: mockCan }) }))
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn(), dismissAll: vi.fn(), toasts: [] }) }))

import { PublicationTimelinePage } from "./PublicationTimelinePage"

const rows = [
  {
    id: 1,
    workflow: 10,
    content_label: "Article X",
    content_type: "articles.article",
    object_id: 5,
    stage: { code: "scheduled", name: "Scheduled" },
    scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    published_at: null,
    status: "scheduled",
    scheduled_by: { id: 1, username: "alice" },
    cancelled_by: null,
    created_at: new Date().toISOString(),
  },
]

describe("PublicationTimelinePage", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockCan.mockReturnValue(true)
    mockCounts.mockReturnValue({ data: { total: 1, overdue: 0, today: 0, attention: 0, failed: 0 } })
  })

  it("renders scheduled rows with type, state and actions", () => {
    mockPage.mockReturnValue({ data: { items: rows, pagination: null }, isLoading: false, isError: false, refetch: vi.fn() })
    renderWithProviders(<PublicationTimelinePage />)
    expect(screen.getByRole("heading", { name: "Publication timeline" })).toBeInTheDocument()
    expect(screen.getByText("Article X")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reschedule" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("shows empty state when nothing scheduled", () => {
    mockPage.mockReturnValue({ data: { items: [], pagination: null }, isLoading: false, isError: false, refetch: vi.fn() })
    renderWithProviders(<PublicationTimelinePage />)
    expect(screen.getByText("Nothing is scheduled.")).toBeInTheDocument()
  })

  it("links locale dots to studio preselect and shows failure state", () => {
    const failed = [
      {
        ...rows[0],
        has_failed: true,
        last_failed_at: new Date().toISOString(),
        last_failed_details: "Blocked: [en] title_en",
        locale_readiness: {
          en: { ready: false, critical: 1, warnings: 1, issues: ["English title is required."] },
          fa: { ready: true, critical: 0, warnings: 0, issues: [] },
          ar: { ready: false, critical: 0, warnings: 2, issues: ["Missing title", "Missing body"] },
        },
      },
    ]
    mockPage.mockReturnValue({ data: { items: failed, pagination: null }, isLoading: false, isError: false, refetch: vi.fn() })
    renderWithProviders(<PublicationTimelinePage />)
    expect(screen.getByText(/Failed — fix & retry/)).toBeInTheDocument()
    const dot = screen.getByRole("link", { name: /open studio in FA/i })
    expect(dot.getAttribute("href")).toBe("/dashboard/articles/5/edit?locale=fa")
  })
})
