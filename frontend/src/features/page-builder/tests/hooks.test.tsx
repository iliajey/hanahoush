import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { usePage, useAnnouncement } from "@/features/page-builder"

const mockedGet = apiClient.get as Mock

beforeEach(() => mockedGet.mockReset())

describe("page-builder hooks", () => {
  it("usePage fetches the composed page by slug", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true, message: "", errors: null,
        data: { id: 1, slug: "home", title: "Home", status: "published", is_home: true, template: "default", version: 1, sections_count: 2, sections: [] },
      },
    })
    const { wrapper } = createTestProviders()
    const { result } = renderHook(() => usePage("home"), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.slug).toBe("home")
    expect(mockedGet.mock.calls[0][0]).toContain("/pages/home/")
  })

  it("useAnnouncement reads the announcement endpoint", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true, message: "", errors: null,
        data: { is_enabled: true, text: "Hello", link: "", link_label: "", dismissible: true, background_color: "brand", text_color: "white", start_at: null, end_at: null },
      },
    })
    const { wrapper } = createTestProviders()
    const { result } = renderHook(() => useAnnouncement(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.text).toBe("Hello")
    expect(mockedGet.mock.calls[0][0]).toContain("/announcement")
  })
})
