import { describe, expect, it } from "vitest"

import {
  changePasswordSchema,
  createForgotPasswordSchema,
  createLoginSchema,
  createResetPasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../schemas"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ username: "alice", password: "Password@123", remember_me: true })
    expect(result.success).toBe(true)
  })

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({ username: "alice", password: "short" })
    expect(result.success).toBe(false)
  })

  it("rejects an empty username", () => {
    const result = loginSchema.safeParse({ username: "   ", password: "Password@123" })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@hanahoush.local" })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      new_password: "Password@123",
      confirm_password: "Password@123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      new_password: "Password@123",
      confirm_password: "Different@123",
    })
    expect(result.success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("rejects mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({
      old_password: "Old@123",
      new_password: "New@123",
      confirm_password: "Other@123",
    })
    expect(result.success).toBe(false)
  })

  it("requires the old password", () => {
    const result = changePasswordSchema.safeParse({
      old_password: "",
      new_password: "New@123",
      confirm_password: "New@123",
    })
    expect(result.success).toBe(false)
  })
})

describe("localized schema factories", () => {
  it("uses the translator for validation messages", () => {
    const t = (key: string) => (key === "auth.validation.usernameRequired" ? "نام کاربری الزامی است" : key)
    const schema = createLoginSchema(t)
    const result = schema.safeParse({ username: "", password: "Password@123" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue.message).toBe("نام کاربری الزامی است")
    }
  })

  it("localizes the email validation message", () => {
    const t = (key: string) => (key === "auth.validation.emailInvalid" ? "ایمیل نامعتبر است" : key)
    const schema = createForgotPasswordSchema(t)
    const result = schema.safeParse({ email: "not-an-email" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("ایمیل نامعتبر است")
    }
  })

  it("localizes the password mismatch message", () => {
    const t = (key: string) => (key === "auth.validation.passwordMismatch" ? "رمزها یکسان نیستند" : key)
    const schema = createResetPasswordSchema(t)
    const result = schema.safeParse({
      new_password: "Password@123",
      confirm_password: "Different@123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "رمزها یکسان نیستند")).toBe(true)
    }
  })
})
