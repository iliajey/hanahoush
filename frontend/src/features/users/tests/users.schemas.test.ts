import { describe, expect, it } from "vitest"

import { createUserFormSchema, editUserFormSchema, setPasswordFormSchema } from "../schemas"

const t = (key: string) => key

describe("user management schemas", () => {
  it("create schema requires username, email, password pair and role", () => {
    const result = createUserFormSchema(t).safeParse({
      username: "ab",
      email: "not-an-email",
      password: "short",
      confirm_password: "different",
      role: "",
      preferred_language: "fa",
      is_active: true,
      is_staff: false,
    })
    expect(result.success).toBe(false)
  })

  it("create schema accepts a valid payload with preferred language", () => {
    const result = createUserFormSchema(t).safeParse({
      username: "new.user",
      first_name: "New",
      last_name: "User",
      email: "new@hanahoush.local",
      phone: "+989120000001",
      password: "Strong@12345",
      confirm_password: "Strong@12345",
      role: "EDITOR",
      preferred_language: "ar",
      is_active: true,
      is_staff: false,
    })
    expect(result.success).toBe(true)
  })

  it("create schema rejects an unknown preferred language", () => {
    const result = createUserFormSchema(t).safeParse({
      username: "new.user",
      email: "new@hanahoush.local",
      password: "Strong@12345",
      confirm_password: "Strong@12345",
      role: "EDITOR",
      preferred_language: "xx",
      is_active: true,
      is_staff: false,
    })
    expect(result.success).toBe(false)
  })

  it("edit schema carries no password material", () => {
    const schema = editUserFormSchema(t)
    const shape = Object.keys((schema as unknown as { shape: Record<string, unknown> }).shape ?? {})
    expect(shape).not.toContain("password")
    expect(shape).not.toContain("new_password")
    const result = schema.safeParse({
      username: "edit.user",
      email: "edit@hanahoush.local",
      role: "VIEWER",
      preferred_language: "en",
      is_active: true,
      is_staff: false,
    })
    expect(result.success).toBe(true)
  })

  it("set-password schema requires the confirmation to match", () => {
    expect(
      setPasswordFormSchema(t).safeParse({
        new_password: "Freshly@12345",
        confirm_password: "Different@1",
      }).success,
    ).toBe(false)
    expect(
      setPasswordFormSchema(t).safeParse({
        new_password: "Freshly@12345",
        confirm_password: "Freshly@12345",
      }).success,
    ).toBe(true)
  })
})
