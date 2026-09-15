import { describe, expect, it, vi, beforeEach } from "vitest"

import { listStaffServices, fetchStaffService, createStaffService, updateStaffService } from "./staff"

const { mockGet, mockPost, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
}))

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: mockGet, post: mockPost, patch: mockPatch },
}))

describe("staff services API", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lists with page_size and status/section filters", async () => {
    mockGet.mockResolvedValue({ data: { data: [], pagination: { count: 0 } } })
    await listStaffServices({ page: 2, pageSize: 20, status: "review", section: 4, q: "api" })
    expect(mockGet).toHaveBeenCalledWith(
      "/services/",
      { params: expect.objectContaining({ page: 2, page_size: 20, status: "review", section: 4, q: "api" }) },
    )
  })

  it("fetches one service by id", async () => {
    mockGet.mockResolvedValue({ data: { data: { id: 3 } } })
    await fetchStaffService(3)
    expect(mockGet).toHaveBeenCalledWith("/services/3/")
  })

  it("creates and updates through the shared service endpoints", async () => {
    mockPost.mockResolvedValue({ data: { data: { id: 9 } } })
    await createStaffService({ title_en: "API Design", slug: "api-design" })
    expect(mockPost).toHaveBeenCalledWith("/services/", { title_en: "API Design", slug: "api-design" })

    mockPatch.mockResolvedValue({ data: { data: { id: 3 } } })
    await updateStaffService(3, { title_en: "API Design 2" })
    expect(mockPatch).toHaveBeenCalledWith("/services/3/", { title_en: "API Design 2" })
  })
})
