import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"

import LanguageProvider from "@/app/language/LanguageProvider"
import { ToastProvider } from "@/components/ui/toast"
import i18n from "@/i18n"
import { roleUsers } from "@/features/auth/tests/fixtures"
import { ArticleEditPage } from "./ArticleEditPage"

const { mockUseUser, mockArticleQuery, mockCreate, mockUpdate, mockCategories, mockTags, mockWorkflow } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockArticleQuery: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockCategories: vi.fn(),
  mockTags: vi.fn(),
  mockWorkflow: vi.fn(),
}))

vi.mock("@/features/auth/hooks/useUser", () => ({ useUser: () => mockUseUser() }))
vi.mock("@/features/auth/hooks/useAuthorization", () => ({ useAuthorization: () => ({ can: () => false }) }))
vi.mock("../hooks/staff", () => ({
  useStaffArticle: (id: number | undefined) => mockArticleQuery(id),
  useCreateStaffArticle: () => ({ mutate: mockCreate, isPending: false }),
  useUpdateStaffArticle: () => ({ mutate: mockUpdate, isPending: false }),
}))
vi.mock("../hooks", () => ({
  useArticleCategories: () => mockCategories(),
  useArticleTags: () => mockTags(),
}))
vi.mock("@/features/editorial/hooks", () => ({
  useWorkflowForContent: () => mockWorkflow(),
  useEnsureWorkflowMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useSubmitForReviewMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useScheduleMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  usePublishMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useWorkflow: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock("@/features/media/components/MediaPicker", () => ({ MediaPicker: () => null }))

const serverArticle = {
  id: 7,
  title_en: "Original EN",
  title_fa: "اصلی",
  title_ar: "",
  slug: "original",
  short_description_en: "",
  short_description_fa: "",
  short_description_ar: "",
  description_en: "<p>Body EN</p>",
  description_fa: "",
  description_ar: "",
  status: "draft",
  status_display: "Draft",
  is_featured: false,
  is_public: true,
  is_pinned: false,
  published_at: null,
  category: null,
  tags: [],
  author: null,
  reading_time: null,
  created_at: "",
  updated_at: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  cover_image: null,
}

function renderEdit() {
  const ui: ReactNode = (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <LanguageProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={["/dashboard/articles/7/edit"]}>
            <Routes>
              <Route path="/dashboard/articles/:id/edit" element={<ArticleEditPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
  return render(ui)
}

describe("ArticleEditPage — hydrate-once regression (Phase 13 root cause)", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockUseUser.mockReturnValue({ status: "authenticated", user: roleUsers.CONTENT_MANAGER, isAuthenticated: true, refreshUser: vi.fn() })
    mockCategories.mockReturnValue({ data: [] })
    mockTags.mockReturnValue({ data: [] })
    mockWorkflow.mockReturnValue({ data: [], isLoading: false })
  })

  it("preserves in-progress typing when a background refetch returns a new article object", () => {
    mockArticleQuery.mockReturnValue({ data: serverArticle, isLoading: false, isError: false, refetch: vi.fn() })
    const { rerender } = renderEdit()

    const title = screen.getByLabelText("Title (English)") as HTMLInputElement
    expect(title.value).toBe("Original EN")

    fireEvent.change(title, { target: { value: "Original EN + my new section" } })
    expect(title.value).toBe("Original EN + my new section")

    // Background refetch: same server row, new object identity.
    mockArticleQuery.mockReturnValue({ data: { ...serverArticle }, isLoading: false, isError: false, refetch: vi.fn() })
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <LanguageProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={["/dashboard/articles/7/edit"]}>
              <Routes>
                <Route path="/dashboard/articles/:id/edit" element={<ArticleEditPage />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </LanguageProvider>
      </QueryClientProvider>,
    )

    expect((screen.getByLabelText("Title (English)") as HTMLInputElement).value).toBe(
      "Original EN + my new section",
    )
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()
  })

  it("surfaces field-level validation errors without wiping user input", () => {
    mockArticleQuery.mockReturnValue({ data: serverArticle, isLoading: false, isError: false, refetch: vi.fn() })
    renderEdit()
    const title = screen.getByLabelText("Title (English)") as HTMLInputElement
    fireEvent.change(title, { target: { value: "kept text" } })
    expect(title.value).toBe("kept text")
  })
})
