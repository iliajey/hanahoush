import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { PageRenderer, UnknownSectionFallback } from "@/features/page-builder"
import type { Page } from "@/features/page-builder/types"

const mockedGet = apiClient.get as Mock

function env(items: unknown[]) {
  return {
    data: {
      success: true, message: "", data: items, errors: null,
      pagination: { count: items.length, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
    },
  }
}

function service(id: number, title: string) {
  return {
    id, title_fa: title, title_en: title, title: title, slug: `s-${id}`,
    description: "A service", section: null, icon: null, cover_image: null,
    status: "published", is_featured: true, is_public: true, sort_order: 0,
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
  }
}

const mockPage: Page = {
  id: 1,
  slug: "home",
  title: "Home",
  status: "published",
  is_home: true,
  template: "default",
  version: 1,
  sections_count: 3,
  sections: [
    { id: 1, type: "services", title: null, is_enabled: true, order: 1, config: {} },
    { id: 2, type: "services", title: null, is_enabled: true, order: 2, config: {} }, // duplicate
    { id: 3, type: "cta", title: null, is_enabled: false, order: 3, config: {} }, // disabled
    { id: 4, type: "mystery", title: null, is_enabled: true, order: 4, config: {} }, // unknown
    { id: 5, type: "faq", title: null, is_enabled: true, order: 5, config: {} }, // neutral -> default
  ],
}

beforeEach(() => {
  mockedGet.mockReset()
  mockedGet.mockImplementation((url: string) => {
    if (url.includes("/services")) return Promise.resolve(env([service(1, "Web Development"), service(2, "ERP Consulting")]))
    return Promise.resolve(env([]))
  })
})

describe("PageRenderer", () => {
  it("renders enabled sections in order and deduplicates types", async () => {
    const { wrapper } = createTestProviders()
    const { container } = render(<PageRenderer page={mockPage} />, { wrapper })

    const serviceSlots = container.querySelectorAll('[data-section-type="services"]')
    // duplicate "services" collapsed into a single slot
    expect(serviceSlots.length).toBe(1)
    // disabled cta section must not render
    expect(container.querySelector('[data-section-type="cta"]')).toBeNull()

    await waitFor(() => expect(screen.getByText("Web Development")).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText("ERP Consulting")).toBeInTheDocument()
  })

  it("renders the unknown-section fallback for unregistered types", async () => {
    const { wrapper } = createTestProviders()
    const { container } = render(<PageRenderer page={mockPage} />, { wrapper })

    await waitFor(() => {
      const fallback = screen.queryByText(/Unknown section type/)
      expect(fallback).not.toBeNull()
    }, { timeout: 5000 })
    expect(screen.getByText("mystery")).toBeInTheDocument()
    void container
  })

  it("annotates every section slot with a token-driven visual state", async () => {
    const { wrapper } = createTestProviders()
    const { container } = render(<PageRenderer page={mockPage} />, { wrapper })

    await waitFor(() => expect(screen.getByText("Web Development")).toBeInTheDocument(), { timeout: 5000 })

    const servicesSlot = container.querySelector('[data-section-type="services"]')
    expect(servicesSlot?.getAttribute("data-visual-state")).toBe("services")

    // Registered but neutral sections fall back to the calm default state.
    const faqSlot = container.querySelector('[data-section-type="faq"]')
    expect(faqSlot?.getAttribute("data-visual-state")).toBe("default")
  })

  it("renders empty state when a page has no enabled sections", () => {
    const { wrapper } = createTestProviders()
    render(<PageRenderer page={{ ...mockPage, sections: [] }} />, { wrapper })
    expect(screen.getByText(/no enabled sections/i)).toBeInTheDocument()
  })

  it("renders the standalone unknown fallback", () => {
    render(<UnknownSectionFallback type="wat" />)
    expect(screen.getByText("wat")).toBeInTheDocument()
  })
})
