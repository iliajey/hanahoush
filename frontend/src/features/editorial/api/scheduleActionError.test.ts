import { describe, expect, it } from "vitest"

import { scheduleActionError } from "./index"

describe("scheduleActionError (Phase 18)", () => {
  it("extracts blocking issues from the axios rejection shape", () => {
    const err = {
      response: {
        data: {
          success: false,
          message: "Publication blocked by critical health issues.",
          data: null,
          errors: {
            code: ["PUBLICATION_BLOCKED"],
            blocking: [{ field: "title_en", locale: "en", message: "English title is required." }],
          },
        },
      },
    }
    const out = scheduleActionError(err)
    expect(out.blocking).toHaveLength(1)
    expect(out.blocking[0]).toMatchObject({ field: "title_en", locale: "en" })
    // Generic message suppressed when structured blockers render.
    expect(out.message).toBeNull()
  })

  it("surfaces plain messages when no blockers exist", () => {
    const out = scheduleActionError({ message: "Only scheduled items can be cancelled." })
    expect(out.blocking).toEqual([])
    expect(out.message).toBe("Only scheduled items can be cancelled.")
  })

  it("returns empty state for unknown errors", () => {
    expect(scheduleActionError(null)).toEqual({ blocking: [], message: null })
    expect(scheduleActionError(new Error("boom"))).toEqual({ blocking: [], message: "boom" })
  })
})
