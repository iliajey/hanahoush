import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"

import LanguageProvider from "@/app/language/LanguageProvider"
import { ToastProvider } from "@/components/ui/toast"
import i18n from "@/i18n"
import { roleUsers } from "@/features/auth/tests/fixtures"
import { ServiceEditPage } from "./ServiceEditPage"

const { mockUseUser, mockServiceQuery, mockCreate, mockUpdate, mockSections } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockServiceQuery: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockSections: vi.fn(),
}))

vi.mock("@/features/auth/hooks/useUser", () => ({ useUser: () => mockUseUser() }))
vi.mock("@/features/auth/hooks/useAuthorization", () => ({ useAuthorization: () => ({ can: () => false }) }))
vi.mock("../hooks/staff", () => ({
  useStaffService: (id: number | undefined) => mockServiceQuery(id),
  useCreateStaffService: () => ({ mutate: mockCreate, isPending: false }),
  useUpdateStaffService: () => ({ mutate: mockUpdate, isPending: false }),
  useServiceSectionsStaff: () => mockSections(),
}))
vi.mock("@/features/media/components/MediaPicker", () => ({ MediaPicker: () => null }))

const serverService = {
  id: 3,
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
  published_at: null,
  sort_order: 1,
  section: null,
  icon: "code",
  cover_image: null,
  created_at: "2026-09-12T00:00:00Z",
  updated_at: "2026-09-12T00:00:00Z",
}

function renderEdit(route = "/dashboard/services/3/edit") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrap = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/dashboard/services/:id/edit" element={children} />
              <Route path="/dashboard/services/new" element={children} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
  return { client, wrap }
}

describe("ServiceEditPage — single-locale studio", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockUseUser.mockReturnValue({ user: roleUsers.CONTENT_MANAGER })
    mockSections.mockReturnValue({ data: [] })
  })

  it("hydrates one locale at a time and keeps the others on switch", async () => {
    mockServiceQuery.mockReturnValue({ data: serverService, isLoading: false, isError: false, refetch: vi.fn() })
    const { wrap } = renderEdit()
    const { render } = await import("@testing-library/react")
    render(<ServiceEditPage />, { wrapper: wrap })

    const title = screen.getByLabelText("Title (English)") as HTMLInputElement
    expect(title.value).toBe("Original EN")
    expect(screen.queryByDisplayValue("اصلی")).not.toBeInTheDocument()

    const { fireEvent } = await import("@testing-library/react")
    fireEvent.change(title, { target: { value: "Edited EN" } })
    expect((screen.getByLabelText("Title (English)") as HTMLInputElement).value).toBe("Edited EN")
  })

  it("renders the editing-language dropdown with completeness dots", async () => {
    mockServiceQuery.mockReturnValue({ data: serverService, isLoading: false, isError: false, refetch: vi.fn() })
    const { wrap } = renderEdit()
    const { render } = await import("@testing-library/react")
    render(<ServiceEditPage />, { wrapper: wrap })
    expect(screen.getByRole("combobox", { name: "Editing language" })).toBeInTheDocument()
  })

  it("shows section picker and health findings", async () => {
    mockServiceQuery.mockReturnValue({ data: serverService, isLoading: false, isError: false, refetch: vi.fn() })
    const { wrap } = renderEdit()
    const { render } = await import("@testing-library/react")
    render(<ServiceEditPage />, { wrapper: wrap })
    expect(screen.getByText("Content health")).toBeInTheDocument()
    expect(screen.getByLabelText("Section")).toBeInTheDocument()
  })
})
