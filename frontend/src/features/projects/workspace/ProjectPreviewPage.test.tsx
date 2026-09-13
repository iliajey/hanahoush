import { describe, expect, it, vi } from "vitest"
import { fireEvent, screen } from "@testing-library/react"
import type * as RouterModule from "react-router-dom"

import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"
import { ProjectPreviewPage } from "./ProjectPreviewPage"

vi.mock("../hooks/staff", () => ({
  useStaffProject: () => ({
    data: {
      id: 7,
      slug: "demo-project",
      title_en: "Demo",
      title_fa: "نمایشی",
      title_ar: "",
      status: "draft",
      status_display: "Draft",
      is_featured: false,
      is_public: true,
      client: "Acme",
      location: "Tehran",
      year: 2025,
      live_url: "https://example.com",
      technologies: [{ id: 1, title_en: "Django", slug: "django" }],
      cover_image: { id: 2, file: "http://localhost:8000/media/cover.png", alt_text_en: "Cover" },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useProjectGallery: () => ({ data: [] }),
}))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useParams: () => ({ id: "7" }), useNavigate: () => vi.fn() }
})

describe("ProjectPreviewPage", () => {
  it("renders the read-only draft preview without publishing", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<ProjectPreviewPage />)
    expect(screen.getByText("Project preview")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Demo" })).toBeInTheDocument()
    expect(screen.getByText("Acme", { exact: false })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "fa" }))
    expect(screen.getAllByText("نمایشی").length).toBeGreaterThan(0)
  })
})
