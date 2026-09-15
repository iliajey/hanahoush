import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"

import { useDirtyGuard } from "./useDirtyGuard"

describe("useDirtyGuard", () => {
  it("registers beforeunload only while dirty", () => {
    const add = vi.spyOn(window, "addEventListener")
    const remove = vi.spyOn(window, "removeEventListener")
    const { rerender, unmount } = renderHook(({ dirty }) => useDirtyGuard(dirty), {
      initialProps: { dirty: false },
    })
    expect(add).not.toHaveBeenCalledWith("beforeunload", expect.any(Function))
    rerender({ dirty: true })
    expect(add).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    unmount()
    expect(remove).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    add.mockRestore()
    remove.mockRestore()
  })
})
