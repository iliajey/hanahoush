import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"

import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"
import { roleUsers } from "@/features/auth/tests/fixtures"
import { ArticlesWorkspacePage } from "./ArticlesWorkspacePage"

const { mockUseUser, mockList, mockWorkflow, mockCategories, mockLogout } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockList: vi.fn(),
  mockWorkflow: vi.fn(),
  mockCategories: vi.fn(),
  mockLogout: vi.fn(),
}))

vi.mock("@/features/auth/hooks/useUser", () => ({ useUser: () => mockUseUser() }))
vi.mock("@/features/auth/hooks/useLogout", () => ({ useLogout: () => ({ mutate: mockLogout }) }))
vi.mock("../hooks/staff", () => ({
  useStaffArticles: (params: unknown) => mockList(params),
  useStaffArticle: () => ({ data: null, isLoading: false }),
  useCreateStaffArticle: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateStaffArticle: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("../hooks", () => ({ useArticleCategories: () => mockCategories() }))
vi.mock("@/features/editorial/hooks", () => ({
  useWorkflowForContent: () => mockWorkflow(),
  useEnsureWorkflowMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSubmitForReviewMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const article = {
  id: 7,
  title_en: "Longform guide",
  title_fa: "",
  slug: "longform-guide",
  status: "draft",
  status_display: "Draft",
  is_featured: true,
  updated_at: "2026-09-12T00:00:00Z",
}

describe("ArticlesWorkspacePage — pagination, filters, preview", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.CONTENT_MANAGER, isAuthenticated: true, refreshUser: vi.fn() })
    mockCategories.mockReturnValue({ data: [{ id: 3, title_en: "Tech", title_fa: "فناوری", slug: "tech" }] })
    mockWorkflow.mockReturnValue({ data: [], isLoading: false })
  })

  it("requests page 1 with pageSize 20 and renders server pagination", () => {
    mockList.mockReturnValue({
      data: {
        items: [article],
        pagination: { count: 41, num_pages: 3, current_page: 1, page_size: 20, next: "x", previous: null },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderWithProviders(<ArticlesWorkspacePage />)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20, ordering: "-updated_at" }))
    expect(screen.getByText("Longform guide")).toBeInTheDocument()
    expect(screen.getByText("41 articles")).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument()
  })

  it("shows preview + edit + public actions and hides pagination on a single page", () => {
    mockList.mockReturnValue({
      data: {
        items: [article],
        pagination: { count: 1, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderWithProviders(<ArticlesWorkspacePage />)
    expect(screen.getByTitle("Preview")).toBeInTheDocument()
    expect(screen.getByTitle("Edit article")).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull()
  })

  it("renders a retryable error state instead of a generic empty block", () => {
    mockList.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() })
    renderWithProviders(<ArticlesWorkspacePage />)
    expect(screen.getByText("Couldn't load articles")).toBeInTheDocument()
    expect(screen.getByText("Try again")).toBeInTheDocument()
  })
})
