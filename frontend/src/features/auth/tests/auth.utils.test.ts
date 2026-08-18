import { describe, expect, it } from "vitest"

import { getApiErrorMessage, getDisplayName, getInitials } from "../utils"

describe("getApiErrorMessage", () => {
  it("extracts the message from a normalized API error", () => {
    expect(getApiErrorMessage({ message: "Invalid credentials", success: false, data: null, errors: null })).toBe(
      "Invalid credentials",
    )
  })

  it("falls back to Error.message", () => {
    expect(getApiErrorMessage(new Error("Network error"))).toBe("Network error")
  })

  it("returns a generic message for unknown errors", () => {
    expect(getApiErrorMessage(null)).toBe("An unexpected error occurred")
  })
})

describe("getDisplayName", () => {
  it("combines first and last name", () => {
    expect(getDisplayName({ first_name: "Alice", last_name: "Smith", username: "alice" })).toBe("Alice Smith")
  })

  it("falls back to username", () => {
    expect(getDisplayName({ first_name: "", last_name: "", username: "alice" })).toBe("alice")
  })

  it("returns a default for null", () => {
    expect(getDisplayName(null)).toBe("User")
  })
})

describe("getInitials", () => {
  it("returns initials for a full name", () => {
    expect(getInitials("Alice Smith")).toBe("AS")
  })

  it("returns the first two characters for a single name", () => {
    expect(getInitials("Alice")).toBe("AL")
  })

  it("returns a fallback for an empty name", () => {
    expect(getInitials("   ")).toBe("?")
  })
})
