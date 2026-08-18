import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { ServicesPage } from "@/app/routes/pages/ServicesPage"

const mockedGet = apiClient.get as Mock

function env(items: unknown[], count?: number) {
  return {
    data: {
      success: true, message: "", data: items, errors: null,
      pagination: { count: count ?? items.length, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
    },
  }
}

const servicesPage = {
  id: 2,
  slug: "services",
  title: "Services",
  status: "published",
  is_home: false,
  template: "default",
  version: 1,
  sections_count: 4,
  total_sections: 4,
  seo: { meta_title: "Hanahoush — Services", meta_description: "Enterprise services" },
  sections: [
    { id: 1, type: "journey", title: null, is_enabled: true, order: 1, config: { steps: [{ key: "problem", icon: "alert", title: "Problem", body: "Analyse the business." }, { key: "result", icon: "trending", title: "Result", body: "Deliver." }] } },
    { id: 2, type: "services", title: null, is_enabled: true, order: 2, config: { items: [{ icon: "code", title: "Software Development", tags: ["Django", "React"], cta: { href: "/contact" } }] } },
    { id: 3, type: "comparison", title: null, is_enabled: true, order: 3, config: { columns: [{ label: "Traditional" }, { label: "Hanahoush" }], rows: [{ factor: "Architecture", traditional: "Monolithic", hanahoush: "Modular" }] } },
    { id: 4, type: "stack", title: null, is_enabled: true, order: 4, config: { technologies: ["Python", "Django", "React"] } },
  ],
}

function defaultRouter(url: string) {
  if (url.includes("/pages/services/")) {
    return { data: { success: true, message: "", data: servicesPage, errors: null } }
  }
  if (url.includes("/site-settings")) {
    return { data: { success: true, message: "", data: { site_name: "Hanahoush", tagline: "Enterprise Platform" }, errors: null } }
  }
  return env([])
}

beforeEach(() => {
  mockedGet.mockReset()
  mockedGet.mockImplementation((url: string) => Promise.resolve(defaultRouter(url)))
})

describe("ServicesPage (page-builder composition)", () => {
  it("composes the services page from backend page configuration", async () => {
    const { wrapper } = createTestProviders()
    render(<ServicesPage />, { wrapper })

    expect(screen.getByRole("main")).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText("Software Development")).toBeInTheDocument(), { timeout: 6000 })
    expect(screen.getByText("Problem")).toBeInTheDocument()
    expect(screen.getByText("Modular")).toBeInTheDocument()
    expect(screen.getByText("Python")).toBeInTheDocument()
  })

  it("shows the error state when the page config fails", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url.includes("/pages/services/")) return Promise.reject(new Error("Connection refused"))
      return Promise.resolve(defaultRouter(url))
    })
    const { wrapper } = createTestProviders()
    render(<ServicesPage />, { wrapper })
    await waitFor(() => expect(screen.getByText("Couldn't load this page")).toBeInTheDocument(), { timeout: 5000 })
  })
})
