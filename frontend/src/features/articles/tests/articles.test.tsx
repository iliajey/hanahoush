import { render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import LanguageProvider from "@/app/language/LanguageProvider"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { transformArticleContent } from "@/features/articles/services/content"
import { readingMinutes, stripHtml, buildArticleParams } from "@/features/articles/utils"
import { CodeBlock } from "@/features/articles/components/CodeBlock"
import { ArticleContent } from "@/features/articles/components/ArticleContent"
import { ArticleDetailPage } from "@/features/articles/pages/ArticleDetailPage"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
const mockedGet = apiClient.get as Mock

const detail = {
  id: 1,
  slug: "django-guide",
  title_en: "Django Guide",
  short_description_en: "A guide.",
  description_en: "<h2>Intro</h2><p>Django rocks.</p><pre><code class=\"language-python\">print('hi')</code></pre>",
  category: { id: 1, title_en: "Technology", slug: "technology" },
  tags: [{ id: 1, title_en: "Django", slug: "django" }],
  cover_image: null,
  reading_time: 2,
  published_at: "2025-01-01T00:00:00Z",
  related_articles: [],
  related_projects: [],
  related_services: [],
}

function wrapper(ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/articles/django-guide"]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <LanguageProvider>
          <Routes>
            <Route path="/articles/:slug" element={ui} />
          </Routes>
        </LanguageProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => mockedGet.mockReset())

describe("content sanitization", () => {
  it("strips scripts and unsafe URLs", () => {
    const { html, toc } = transformArticleContent(
      '<h2>Intro</h2><p onclick="alert(1)">Hello</p><script>alert("xss")</script><a href="javascript:alert(1)">bad</a>',
    )
    expect(html).not.toContain("<script")
    expect(html).not.toContain("onclick")
    expect(html).not.toContain("javascript:")
    expect(html).toContain("<h2")
    expect(toc[0]).toMatchObject({ level: 2, text: "Intro" })
  })

  it("extracts a table of contents from headings", () => {
    const { toc } = transformArticleContent("<h2>One</h2><p>x</p><h3>Two</h3>")
    expect(toc.map((t) => t.text)).toEqual(["One", "Two"])
    expect(toc[1].level).toBe(3)
  })

  it("marks code block languages", () => {
    const { html } = transformArticleContent('<pre><code class="language-python">print(1)</code></pre>')
    expect(html).toContain("language-python")
  })
})

describe("reading time + helpers", () => {
  it("computes deterministic reading minutes", () => {
    expect(readingMinutes("word ".repeat(200), "en")).toBe(1)
    expect(readingMinutes("word ".repeat(400), "en")).toBe(2)
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
  })

  it("builds article API params", () => {
    const params = buildArticleParams({ q: "ERP", categorySlug: "business", tagSlug: "erp", featuredOnly: true, pageSize: 12 })
    expect(params).toMatchObject({ q: "ERP", category_slug: "business", tags: "erp", is_featured: true, page_size: 12 })
  })
})

describe("CodeBlock", () => {
  it("renders language label + code", () => {
    render(<CodeBlock code="print('hi')" language="python" />)
    expect(screen.getByText("python")).toBeInTheDocument()
    expect(screen.getByText(/print/)).toBeInTheDocument()
  })
})

describe("ArticleContent", () => {
  it("renders sanitized body", () => {
    render(<ArticleContent html='<h2>Intro</h2><script>alert(1)</script><p>Hello</p>' />)
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument()
    expect(screen.getByText("Intro")).toBeInTheDocument()
  })
})

describe("ArticleDetailPage", () => {
  it("renders the article and 404s for unknown slugs", async () => {
    mockedGet.mockImplementation((url: unknown) => {
      if (typeof url !== "string") return Promise.resolve({ data: { success: true, message: "", data: null, errors: null } })
      if (url.includes("/articles/by-slug/")) {
        return Promise.resolve({ data: { success: true, message: "", data: detail, errors: null } })
      }
      return Promise.resolve({ data: { success: true, message: "", data: [], errors: null, pagination: { count: 0 } } })
    })
wrapper(<ArticleDetailPage />)
    await screen.findByRole("heading", { level: 1, name: "Django Guide" }, { timeout: 6000 })
  })

  it("shows not-found for an unknown slug", async () => {
    mockedGet.mockImplementation((url: unknown) => {
      if (typeof url !== "string") return Promise.resolve({ data: { success: true, message: "", data: null, errors: null } })
      if (url.includes("/articles/by-slug/")) return Promise.reject(new Error("Not found"))
      return Promise.resolve({ data: { success: true, message: "", data: [], errors: null, pagination: { count: 0 } } })
    })
    wrapper(<ArticleDetailPage />)
    await waitFor(() => expect(screen.getByText(/Article not found/i)).toBeInTheDocument(), { timeout: 6000 })
  })
})

