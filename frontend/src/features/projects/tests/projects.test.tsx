import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"
import type { ReactNode } from "react"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { useProjectsFiltered } from "@/features/projects/hooks"
import { buildProjectParams } from "@/features/projects/api"
import { ArchitectureViewer, ProjectGallery } from "@/features/projects/components"
import { ProjectCaseStudyPage } from "@/features/projects/pages/ProjectCaseStudyPage"
import LanguageProvider from "@/app/language/LanguageProvider"
import { Route, Routes, MemoryRouter } from "react-router-dom"

const mockedGet = apiClient.get as Mock

const caseStudy = {
  id: 1,
  slug: "demo-erp-system",
  title: "Enterprise Resource Planning System",
  title_en: "Enterprise Resource Planning System",
  short_description: "A full ERP deployment.",
  description: "Long description",
  category: { id: 3, title_en: "Enterprise", slug: "enterprise" },
  technologies: [{ id: 1, title_en: "Django", slug: "django" }],
  cover_image: null,
  end_date: "2025-03-01",
  year: 2025,
  is_featured: true,
  is_public: true,
  images: [],
  case_study: {
    challenge: "Legacy systems slowed change.",
    objectives: "Ship a scalable solution.",
    solution_approach: "Modular architecture.",
  },
  related_projects: [],
  related_articles: [],
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => mockedGet.mockReset())

describe("project filters -> API params", () => {
  it("maps domain filters to backend query params", () => {
    const params = buildProjectParams({ categoryId: 3, technologySlug: "django", year: 2025, q: "ERP", featuredOnly: true, pageSize: 12 })
    expect(params).toMatchObject({ category: 3, technologies: "django", year: 2025, q: "ERP", is_featured: true, page_size: 12 })
  })

  it("sends filters to the API", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, message: "", data: [], errors: null, pagination: { count: 0 } },
    })
    const { result } = renderHook(() => useProjectsFiltered({ year: 2025, pageSize: 12 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [, config] = mockedGet.mock.calls[0]
    expect(config.params.year).toBe(2025)
    expect(config.params.page_size).toBe(12)
  })
})

describe("ArchitectureViewer", () => {
  it("shows a graceful fallback when no architecture exists", () => {
    render(<ArchitectureViewer architecture={null} />)
    expect(screen.getByText(/Architecture information is not available/i)).toBeInTheDocument()
  })

  it("renders only the supplied nodes", () => {
    render(
      <ArchitectureViewer
        architecture={{
          description: "Layered architecture.",
          nodes: [{ layer: "Backend", labels: [{ en: "Django" }] }],
        }}
      />,
    )
    expect(screen.getByText("Django")).toBeInTheDocument()
    expect(screen.getByText("Backend")).toBeInTheDocument()
  })
})

describe("ProjectGallery", () => {
  it("shows a graceful empty state", () => {
    render(<ProjectGallery images={[]} />)
    expect(screen.getByText(/No gallery images/i)).toBeInTheDocument()
  })

  it("opens a lightbox on click", () => {
    render(<ProjectGallery images={[{ src: "/a.jpg", alt: "First image" }]} />)
    fireEvent.click(screen.getByRole("button", { name: /Open image 1/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("ProjectCaseStudyPage", () => {
  it("renders the case study hero + sections from the API", async () => {
    mockedGet.mockImplementation((url: unknown) => {
      if (typeof url !== "string") return Promise.resolve({ data: { success: true, message: "", data: null, errors: null } })
      if (url.includes("/projects/by-slug/")) {
        return Promise.resolve({ data: { success: true, message: "", data: caseStudy, errors: null } })
      }
      return Promise.resolve({ data: { success: true, message: "", data: [], errors: null, pagination: { count: 0 } } })
    })
    render(
      <MemoryRouter initialEntries={["/projects/demo-erp-system"]}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <LanguageProvider>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectCaseStudyPage />} />
            </Routes>
          </LanguageProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await screen.findByRole("heading", { level: 1, name: "Enterprise Resource Planning System" }, { timeout: 6000 })
    await waitFor(() => expect(screen.getByText("Legacy systems slowed change.")).toBeInTheDocument(), { timeout: 6000 })
  })

  it("shows not-found for an unknown slug", async () => {
    mockedGet.mockImplementation((url: unknown) => {
      if (typeof url !== "string") return Promise.resolve({ data: { success: true, message: "", data: null, errors: null } })
      if (url.includes("/projects/by-slug/")) return Promise.reject(new Error("Not found"))
      return Promise.resolve({ data: { success: true, message: "", data: [], errors: null, pagination: { count: 0 } } })
    })
    render(
      <MemoryRouter initialEntries={["/projects/unknown"]}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <LanguageProvider>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectCaseStudyPage />} />
            </Routes>
          </LanguageProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText(/Case study not found/i)).toBeInTheDocument(), { timeout: 6000 })
  })
})