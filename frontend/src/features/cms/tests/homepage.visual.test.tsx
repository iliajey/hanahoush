import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock("@/design/background", () => ({
  SiteBackground: () => <div data-testid="site-background" />,
  AnimatedGrid: () => <div data-testid="animated-grid" />,
  GradientMesh: () => <div data-testid="gradient-mesh" />,
  NoiseLayer: () => <div data-testid="noise-layer" />,
  Particles: () => <div data-testid="particles" />,
}))

import { apiClient } from "@/shared/api/axiosClient"
import { HomePage } from "@/app/routes/pages/HomePage"

const mockedGet = apiClient.get as Mock

function env(items: unknown[], count?: number) {
  return {
    data: {
      success: true, message: "", data: items, errors: null,
      pagination: { count: count ?? items.length, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
    },
  }
}

function service(id: number, title: string) {
  return {
    id, title_fa: title, title_en: title, title: title, slug: `s-${id}`,
    description: "Service description", section: null, icon: null, cover_image: null,
    status: "published", is_featured: true, is_public: true, sort_order: 0,
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  }
}

const homePage = {
  id: 1,
  slug: "home",
  title: "Home",
  status: "published",
  is_home: true,
  template: "default",
  version: 1,
  sections_count: 2,
  total_sections: 2,
  seo: { meta_title: "Home SEO", meta_description: "SEO description" },
  sections: [
    { id: 1, type: "services", title: null, is_enabled: true, order: 1, config: {} },
    { id: 2, type: "cta", title: null, is_enabled: true, order: 2, config: { title: "Ready to build?" } },
  ],
}

function defaultRouter(url: string) {
  if (url.includes("/pages/home/")) {
    return { data: { success: true, message: "", data: homePage, errors: null } }
  }
  if (url.includes("/services")) return env([service(1, "Web Development"), service(2, "ERP Consulting")])
  if (url.includes("/site-settings")) {
    return { data: { success: true, message: "", data: { site_name: "Hanahoush", tagline: "Enterprise Platform" }, errors: null } }
  }
  return env([])
}

beforeEach(() => {
  mockedGet.mockReset()
  mockedGet.mockImplementation((url: string) => Promise.resolve(defaultRouter(url)))
})

describe("HomePage visual QA (headless, page-builder)", () => {
  it("composes the home page from backend page configuration", async () => {
    const { wrapper } = createTestProviders()
    render(<HomePage />, { wrapper })

    expect(screen.getByRole("main")).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText("Web Development")).toBeInTheDocument(), { timeout: 6000 })
    expect(screen.getByText("ERP Consulting")).toBeInTheDocument()
    expect(screen.getByText("Ready to build?")).toBeInTheDocument()
    expect(screen.queryByText("Pars Industrial")).not.toBeInTheDocument()
  })

  it("shows a page-level skeleton while the page config loads", () => {
    mockedGet.mockImplementation((url: string) =>
      url.includes("/pages/home/")
        ? new Promise((resolve) => setTimeout(() => resolve(defaultRouter(url)), 200))
        : Promise.resolve(defaultRouter(url)),
    )
    const { wrapper } = createTestProviders()
    render(<HomePage />, { wrapper })
    expect(document.querySelectorAll("[class*='animate-pulse']").length).toBeGreaterThan(0)
  })

  it("renders an error state when the page config fails to load", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url.includes("/pages/home/")) return Promise.reject(new Error("Connection refused"))
      return Promise.resolve(defaultRouter(url))
    })
    const { wrapper } = createTestProviders()
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText("Couldn't load this page")).toBeInTheDocument(), { timeout: 5000 })
  })
})
