import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"
import type { ReactNode } from "react"

vi.mock("@/shared/api/axiosClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

import { apiClient } from "@/shared/api/axiosClient"
import { useWorkflow, useWorkflows, useLockMutations } from "@/features/editorial/hooks"

const mockedGet = apiClient.get as Mock
const mockedPost = apiClient.post as Mock

const workflow = {
  id: 1,
  content_type: 1,
  object_id: 1,
  content_label: "Article",
  stage: { code: "in_review", name: "In Review", order: 2, requires_approval: true, allowed_transitions: ["seo_review", "draft"] },
  version: 2,
  is_soft_published: false,
  pending_approvals_count: 1,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  stages: [],
  revisions: [],
  approvals: [],
  schedules: [],
  comments: [],
  audit: [],
  lock: null,
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  mockedGet.mockReset()
  mockedPost.mockReset()
})

describe("editorial hooks", () => {
  it("useWorkflows lists workflows", async () => {
    mockedGet.mockResolvedValueOnce({ data: { success: true, message: "", data: [workflow], errors: null } })
    const { result } = renderHook(() => useWorkflows(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].stage.code).toBe("in_review")
  })

  it("useWorkflow fetches detail by id", async () => {
    mockedGet.mockResolvedValueOnce({ data: { success: true, message: "", data: workflow, errors: null } })
    const { result } = renderHook(() => useWorkflow(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet.mock.calls[0][0]).toContain("/workflows/1/")
    expect(result.current.data?.content_label).toBe("Article")
  })

  it("lock mutations acquire and release", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { success: true, message: "Lock acquired", data: { id: 9, content_label: "Article", locked_by: { id: 1, username: "alice" }, expires_at: new Date().toISOString(), note: "", created_at: new Date().toISOString() }, errors: null },
    })
    const { result } = renderHook(() => useLockMutations(), { wrapper })
    result.current.acquire.mutate({ contentType: "articles.article", objectId: 1 })
    await waitFor(() => expect(result.current.acquire.isSuccess).toBe(true))
    expect(result.current.acquire.data?.id).toBe(9)
  })
})
