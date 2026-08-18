import { beforeEach, describe, expect, it } from "vitest"

import {
  clearSectionRenderRecords,
  getSectionRenderRecords,
  recordSectionRender,
  useSectionRenderRecords,
} from "@/features/page-builder/renderer/analytics"
import { renderHook, act } from "@testing-library/react"

describe("section render analytics", () => {
  beforeEach(() => clearSectionRenderRecords())

  it("records section renders with timing", () => {
    recordSectionRender({ type: "hero", startedAt: 0, durationMs: 12, status: "loaded" })
    recordSectionRender({ type: "unknown", startedAt: 0, durationMs: 3, status: "fallback" })
    const records = getSectionRenderRecords()
    expect(records).toHaveLength(2)
    expect(records[0].type).toBe("unknown")
    expect(records[0].status).toBe("fallback")
    expect(records[1].status).toBe("loaded")
  })

  it("observes new records reactively", () => {
    const { result } = renderHook(() => useSectionRenderRecords())
    expect(result.current).toHaveLength(0)
    act(() => {
      recordSectionRender({ type: "services", startedAt: 0, durationMs: 5, status: "loaded" })
    })
    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toMatchObject({ type: "services", status: "loaded" })
  })

  it("clears records", () => {
    recordSectionRender({ type: "cta", startedAt: 0, durationMs: 1, status: "loaded" })
    clearSectionRenderRecords()
    expect(getSectionRenderRecords()).toHaveLength(0)
  })
})