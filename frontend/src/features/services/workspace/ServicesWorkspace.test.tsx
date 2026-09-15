import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"

import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"
import { roleUsers } from "@/features/auth/tests/fixtures"
import { ServicesWorkspacePage } from "./ServicesWorkspacePage"

const { mockUseUser, mockUseAuthz, mockList, mockSections, mockLogout } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseAuthz: vi.fn(),
  mockList: vi.fn(),
  mockSections: vi.fn(),
  mockLogout: vi.fn(),
}))

vi.mock("@/features/auth/hooks/useUser", () => ({ useUser: () => mockUseUser() }))
vi.mock("@/features/auth/hooks/useAuthorization", () => ({ useAuthorization: () => mockUseAuthz() }))
vi.mock("@/features/auth/hooks/useLogout", () => ({ useLogout: () => ({ mutate: mockLogout }) }))
vi.mock("../hooks/staff", () => ({
  useStaffServices: (params: unknown) => mockList(params),
  useServiceSectionsStaff: () => mockSections(),
}))

const service = {
  id: 3,
  title_en: "Web Development",
  title_fa: "توسعه وب",
  slug: "web-development",
  status: "published",
  status_display: "Published",
  is_published: true,
  is_featured: false,
  is_public: true,
  published_at: null,
  sort_order: 1,
  section: { id: 1, title_fa: "نرم‌افزار", title_en: "Software", title_ar: "", slug: "software" },
  icon: "code",
  cover_image: null,
  created_at: "2026-09-12T00:00:00Z",
  updated_at: "2026-09-12T00:00:00Z",
}

describe("ServicesWorkspacePage — pagination, filters, preview", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.CONTENT_MANAGER, isAuthenticated: true, refreshUser: vi.fn() })
    mockUseAuthz.mockReturnValue({ can: () => true })
    mockSections.mockReturnValue({ data: [{ id: 1, title_en: "Software", title_fa: "نرم‌افزار", slug: "software" }] })
  })

  it("requests page 1 with pageSize 20 and renders server pagination", () => {
    mockList.mockReturnValue({
      data: {
        items: [service],
        pagination: { count: 41, num_pages: 3, current_page: 1, page_size: 20, next: "x", previous: null },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderWithProviders(<ServicesWorkspacePage />)
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }))
    expect(screen.getByText("Web Development")).toBeInTheDocument()
    expect(screen.getByText("41 services")).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument()
  })

  it("shows preview + edit + public actions and hides pagination on a single page", () => {
    mockList.mockReturnValue({
      data: {
        items: [service],
        pagination: { count: 1, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderWithProviders(<ServicesWorkspacePage />)
    expect(screen.getByTitle("Preview")).toBeInTheDocument()
    expect(screen.getByTitle("Edit service")).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument()
  })

  it("hides the write action for read-only roles", () => {
    mockUseAuthz.mockReturnValue({ can: () => false })
    mockList.mockReturnValue({
      data: {
        items: [service],
        pagination: { count: 1, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderWithProviders(<ServicesWorkspacePage />)
    expect(screen.queryByRole("button", { name: "New service" })).not.toBeInTheDocument()
  })
})
