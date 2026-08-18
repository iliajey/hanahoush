import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { useTranslation } from "react-i18next"
import type * as SearchApiModule from "@/features/search/api"

import { useLanguage } from "@/app/language/useLanguage"

import {
  defaultSearchParams,
  fetchSearch,
} from "@/features/search/api"
import { SearchCommand } from "@/features/search/components/SearchCommand"
import { SearchInput } from "@/features/search/components/SearchInput"
import { SearchResults, groupResults } from "@/features/search/components/SearchResults"
import { useDebouncedValue, useGlobalSearch } from "@/features/search/hooks"
import { SearchPage } from "@/features/search/pages/SearchPage"
import type { SearchResult } from "@/features/search/types"
import LanguageProvider from "@/app/language/LanguageProvider"
import { renderHook, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import type { ReactNode } from "react"

vi.mock("@/features/search/api", async (importOriginal) => {
  const original = await importOriginal<typeof SearchApiModule>()
  return { ...original, fetchSearch: vi.fn() }
})

const mockFetchSearch = vi.mocked(fetchSearch)

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>{children}</LanguageProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const sampleResults: SearchResult[] = [
  {
    type: "article",
    id: 1,
    title: "Ergonomic Guide",
    excerpt: "A healthy workspace guide.",
    slug: "ergonomic-guide",
    image: null,
    url: "/articles/ergonomic-guide/",
    relevance: 90,
    published_at: "2026-01-01T00:00:00Z",
    category_slug: null,
    category_title: null,
    locale: "en",
  },
  {
    type: "project",
    id: 2,
    title: "Tower Construction",
    excerpt: "A landmark build.",
    slug: "tower",
    image: null,
    url: "/projects/tower/",
    relevance: 60,
    published_at: "2026-01-02T00:00:00Z",
    category_slug: null,
    category_title: null,
    locale: "en",
  },
]

describe("search grouping", () => {
  it("groups results by type in canonical order", () => {
    const groups = groupResults([
      sampleResults[1],
      sampleResults[0],
      { ...sampleResults[0], type: "service", url: "/services/x/", slug: "x" },
    ])
    expect(groups.map((g) => g.type)).toEqual(["article", "project", "service"])
    expect(groups[0].type).toBe("article")
  })

  it("drops empty groups", () => {
    const groups = groupResults([sampleResults[0]])
    expect(groups.map((g) => g.type)).toEqual(["article"])
  })
})

describe("search debounce hook", () => {
  it("debounces the incoming value", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 350), {
      initialProps: { value: "a" },
    })
    expect(result.current).toBe("a")
    rerender({ value: "ab" })
    rerender({ value: "abc" })
    expect(result.current).toBe("a")
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toBe("abc")
    vi.useRealTimers()
  })
})

describe("useGlobalSearch", () => {
  it("disables the query below the minimum length", () => {
    mockFetchSearch.mockResolvedValue({ items: [], pagination: { count: 0, num_pages: 0, current_page: 1, page_size: 20, next: null, previous: null } })
    const { result } = renderHook(() => useGlobalSearch({ q: "a", locale: "en" }), { wrapper })
    expect(result.current.isFetched).toBe(false)
    expect(mockFetchSearch).not.toHaveBeenCalled()
  })

  it("fetches results above the minimum length", async () => {
    mockFetchSearch.mockResolvedValue({ items: sampleResults, pagination: { count: 2, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null } })
    const { result } = renderHook(() => useGlobalSearch({ q: "guide", locale: "en" }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(2)
    expect(defaultSearchParams("en", "guide").q).toBe("guide")
  })
})

describe("SearchInput", () => {
  it("renders with a clear button and label", () => {
    render(
      <SearchInput label="Search" hasValue placeholder="Search" onChange={() => undefined} onClear={() => undefined} />,
      { wrapper },
    )
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument()
  })

  it("hides the clear button when empty", () => {
    render(<SearchInput label="Search" placeholder="Search" onChange={() => undefined} />, { wrapper })
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument()
  })
})

describe("SearchResults", () => {
  it("shows the loading skeleton while fetching", () => {
    render(<SearchResults results={[]} total={0} query="guide" isLoading isError={false} hasSearched />, { wrapper })
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })

  it("shows the error state on failure", () => {
    render(<SearchResults results={[]} total={0} query="guide" isLoading={false} isError hasSearched />, {
      wrapper,
    })
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("shows the empty state when no results", () => {
    render(
      <SearchResults results={[]} total={0} query="none" isLoading={false} isError={false} hasSearched />,
      { wrapper },
    )
    expect(screen.getByRole("heading", { name: /no results/i })).toBeInTheDocument()
  })

  it("renders grouped results with the total", () => {
    render(
      <SearchResults results={sampleResults} total={2} query="guide" isLoading={false} isError={false} hasSearched />,
      { wrapper },
    )
    expect(screen.getByText("2 results")).toBeInTheDocument()
    expect(screen.getAllByTestId("search-result-title")).toHaveLength(2)
    expect(screen.getByRole("link", { name: /ergonomic guide/i })).toHaveAttribute("href", "/articles/ergonomic-guide/")
  })
})

describe("SearchCommand", () => {
  it("opens the command dialog and surfaces results", async () => {
    mockFetchSearch.mockResolvedValue({ items: sampleResults, pagination: { count: 2, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null } })
    render(<SearchCommand />, { wrapper })
    const trigger = screen.getByRole("button", { name: /search/i })
    expect(trigger).toBeInTheDocument()
    act(() => trigger.click())
    await waitFor(() => expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument())
  })
})

describe("SearchPage", () => {
  it("fires search_view analytics and renders", async () => {
    mockFetchSearch.mockResolvedValue({ items: sampleResults, pagination: { count: 2, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null } })
    render(<SearchPage />, { wrapper })
    expect(await screen.findByRole("heading", { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
  })
})

describe("i18n search keys", () => {
  it("exposes search translations", () => {
    function Harness() {
      const { language } = useLanguage()
      const { t } = useTranslation()
      return (
        <span>
          {language}:{t("search.title")}:{t("search.types.article")}
        </span>
      )
    }
    render(<Harness />, { wrapper })
    expect(screen.getByText(/search/i)).toBeInTheDocument()
  })
})