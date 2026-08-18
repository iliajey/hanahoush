import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { AboutPage } from "./AboutPage"

const mockedGet = apiClient.get as Mock

const aboutPage = {
  id: 5,
  slug: "about",
  title: "About",
  status: "published",
  is_home: false,
  template: "default",
  version: 1,
  sections_count: 5,
  total_sections: 5,
  seo: { meta_title: "Hanahoush — About", meta_description: "About the company", robots: "index,follow" },
  sections: [
    { id: 1, type: "company_story", title: null, is_enabled: true, order: 1, config: {} },
    { id: 2, type: "values", title: null, is_enabled: true, order: 2, config: { values: [{ title: "Engineering quality", body: "Code that lasts." }, { title: "Transparency", body: "Visible progress." }] } },
    { id: 3, type: "offices", title: null, is_enabled: true, order: 3, config: {} },
    { id: 4, type: "social_links", title: null, is_enabled: true, order: 4, config: {} },
  ],
}

function envelope(data: unknown, pagination?: unknown) {
  return { data: { success: true, message: "", data, errors: null, pagination } }
}

function defaultRouter(url: string) {
  if (url.includes("/pages/about/")) return { data: { success: true, message: "", data: aboutPage, errors: null } }
  if (url.includes("/about")) return envelope([{ id: 1, title: "About Hanahoush", description: "Our story", mission: "Mission text", vision: "Vision text", hero_image: null }])
  if (url.includes("/site-settings")) return envelope({ site_name: "Hanahoush", logo: null, contact_email: "info@example.com", contact_phone: "+98" })
  if (url.includes("/faqs")) return envelope([], { count: 0, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null })
  if (url.includes("/offices")) return envelope([{ id: 1, name: "Headquarters", address: "Tehran, Valiasr", city: "Tehran", country: "Iran", phone: "+98", email: "info@example.com" }])
  if (url.includes("/social-links")) return envelope([{ id: 1, platform: "linkedin", label: "LinkedIn", url: "https://linkedin.example" }])
  return envelope([])
}

beforeEach(() => {
  mockedGet.mockReset()
  mockedGet.mockImplementation((url: string) => Promise.resolve(defaultRouter(url)))
})

describe("AboutPage (page-builder composition)", () => {
  it("composes the about page from backend configuration", async () => {
    const { wrapper } = createTestProviders()
    render(<AboutPage />, { wrapper })

    await waitFor(
      () => expect(screen.getByText("Engineering quality")).toBeInTheDocument(),
      { timeout: 6000 },
    )
    expect(screen.getByText("Transparency")).toBeInTheDocument()
    expect(screen.getByText("Our story")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("Headquarters")).toBeInTheDocument(), { timeout: 6000 })
    expect(screen.getByText("LinkedIn")).toBeInTheDocument()
  })

  it("shows the error state when the page config fails", async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url.includes("/pages/about/")) return Promise.reject(new Error("Connection refused"))
      return Promise.resolve(defaultRouter(url))
    })
    const { wrapper } = createTestProviders()
    render(<AboutPage />, { wrapper })
    await waitFor(
      () => expect(screen.getByText("Couldn't load this page")).toBeInTheDocument(),
      { timeout: 5000 },
    )
  })

  it("sets robots noindex when the SEO config says so", async () => {
    const noindex = { ...aboutPage, seo: { ...aboutPage.seo, robots: "noindex,nofollow" } }
    mockedGet.mockImplementation((url: string) => {
      if (url.includes("/pages/about/")) return { data: { success: true, message: "", data: noindex, errors: null } }
      return Promise.resolve(defaultRouter(url))
    })
    const { wrapper } = createTestProviders()
    render(<AboutPage />, { wrapper })
    await waitFor(() => expect(screen.getByText("Engineering quality")).toBeInTheDocument(), { timeout: 6000 })
    const robots = document.querySelector('meta[name="robots"]')
    expect(robots?.getAttribute("content")).toBe("noindex,nofollow")
  })
})