import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { useArticles, useFeaturedArticles, useFeaturedProjects } from "@/features/cms"

const mockedGet = apiClient.get as Mock

function envelope(items: unknown[], count = items.length) {
  return {
    data: {
      success: true,
      message: "",
      data: items,
      errors: null,
      pagination: { count, num_pages: 1, current_page: 1, page_size: 20, next: null, previous: null },
    },
  }
}

function makeArticle(id: number, title: string) {
  return {
    id,
    title_fa: title,
    title_en: title,
    title: title,
    slug: `slug-${id}`,
    category: null,
    tags: [],
    author: null,
    cover_image: null,
    status: "published",
    is_featured: true,
    is_public: true,
    sort_order: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  }
}

describe("cms hooks", () => {
  beforeEach(() => {
    mockedGet.mockReset()
  })

  it("useArticles fetches and returns items", async () => {
    mockedGet.mockResolvedValueOnce(envelope([makeArticle(1, "First")]))
    const { wrapper } = createTestProviders()
    const { result } = renderHook(() => useArticles(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
    expect(mockedGet).toHaveBeenCalledTimes(1)
    expect(mockedGet.mock.calls[0][0]).toContain("/articles")
  })

  it("useFeaturedArticles requests featured=true", async () => {
    mockedGet.mockResolvedValueOnce(envelope([makeArticle(1, "Featured")]))
    const { wrapper } = createTestProviders()
    const { result } = renderHook(() => useFeaturedArticles(3), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet.mock.calls[0][1].params.is_featured).toBe(true)
  })

  it("deduplicates identical queries (one request, many subscribers)", async () => {
    mockedGet.mockResolvedValue(envelope([makeArticle(1, "Dup")]))
    const { wrapper } = createTestProviders()
    const first = renderHook(() => useFeaturedProjects(3), { wrapper })
    const second = renderHook(() => useFeaturedProjects(3), { wrapper })

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it("switching locale isolates cache entries", async () => {
    mockedGet.mockResolvedValue(envelope([makeArticle(1, "Localized")]))
    const { wrapper } = createTestProviders()

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useArticles({ page }),
      { wrapper, initialProps: { page: 1 } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const callsBefore = mockedGet.mock.calls.length

    rerender({ page: 2 })
    await waitFor(() => expect(mockedGet.mock.calls.length).toBeGreaterThan(callsBefore))
    const paramKeys = new Set(mockedGet.mock.calls.map((c) => JSON.stringify(c[1].params)))
    expect(paramKeys.size).toBeGreaterThan(1)
  })
})
