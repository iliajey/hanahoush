/** Zod validation schemas for authentication forms (localized messages). */
import { z } from "zod"

/** Translator signature matching i18next's `t`. */
export type SchemaTranslator = (key: string, options?: Record<string, unknown>) => string

const DEFAULT_MESSAGES: Record<string, string> = {
  "auth.validation.usernameRequired": "Username is required",
  "auth.validation.emailRequired": "Enter a valid email address",
  "auth.validation.emailInvalid": "Enter a valid email address",
  "auth.validation.passwordMin": "Password must be at least 8 characters",
  "auth.validation.passwordMismatch": "Passwords do not match",
  "auth.validation.currentPasswordRequired": "Current password is required",
}

/** Fallback translator used when a schema is created without i18n context. */
function defaultT(key: string): string {
  return DEFAULT_MESSAGES[key] ?? key
}

export function createLoginSchema(t: SchemaTranslator = defaultT) {
  return z.object({
    username: z.string().trim().min(3, t("auth.validation.usernameRequired")),
    password: z.string().min(8, t("auth.validation.passwordMin")),
    remember_me: z.boolean().optional(),
  })
}

export function createForgotPasswordSchema(t: SchemaTranslator = defaultT) {
  return z.object({
    email: z.string().trim().email(t("auth.validation.emailInvalid")),
  })
}

export function createResetPasswordSchema(t: SchemaTranslator = defaultT) {
  return z
    .object({
      new_password: z.string().min(8, t("auth.validation.passwordMin")),
      confirm_password: z.string().min(8, t("auth.validation.passwordMin")),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirm_password"],
    })
}

export function createChangePasswordSchema(t: SchemaTranslator = defaultT) {
  return z
    .object({
      old_password: z.string().min(1, t("auth.validation.currentPasswordRequired")),
      new_password: z.string().min(8, t("auth.validation.passwordMin")),
      confirm_password: z.string().min(8, t("auth.validation.passwordMin")),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirm_password"],
    })
}

export function createProfileSchema(t: SchemaTranslator = defaultT) {
  return z.object({
    first_name: z.string().trim().max(150).optional(),
    last_name: z.string().trim().max(150).optional(),
    email: z.string().trim().email(t("auth.validation.emailInvalid")).optional().or(z.literal("")),
    phone: z.string().trim().max(20).optional(),
    preferred_language: z.enum(["fa", "en", "ar"]).optional(),
  })
}

/** Backward-compatible default instances (English) for tests and exports. */
export const loginSchema = createLoginSchema()
export const forgotPasswordSchema = createForgotPasswordSchema()
export const resetPasswordSchema = createResetPasswordSchema()
export const changePasswordSchema = createChangePasswordSchema()
export const profileSchema = createProfileSchema()

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
