/** Zod validation schemas for the user-management forms (localized messages).
 *
 * Validation mirrors the backend rules (AdminUserWriteSerializer /
 * AdminUserCreateSerializer): username charset, email format, phone digits
 * and the password pair. The backend re-validates everything.
 */
import { z } from "zod"

import type { SchemaTranslator } from "@/features/auth/schemas"

const DEFAULT_MESSAGES: Record<string, string> = {
  "users.validation.usernameRequired": "Username is required",
  "users.validation.usernameFormat": "Use 3-150 letters, numbers, or . _ - characters",
  "users.validation.emailRequired": "Enter a valid email address",
  "users.validation.phoneInvalid": "Enter a valid mobile number",
  "users.validation.passwordRequired": "Password is required",
  "users.validation.passwordMin": "Password must be at least 8 characters",
  "users.validation.passwordMismatch": "Passwords do not match",
  "users.validation.roleRequired": "Select a role",
}

function defaultT(key: string): string {
  return DEFAULT_MESSAGES[key] ?? key
}

export function createUserFormSchema(t: SchemaTranslator = defaultT) {
  return z
    .object({
      username: z
        .string()
        .trim()
        .min(3, t("users.validation.usernameRequired"))
        .regex(/^[A-Za-z0-9._-]{3,150}$/, t("users.validation.usernameFormat")),
      first_name: z.string().trim().max(150).optional().or(z.literal("")),
      last_name: z.string().trim().max(150).optional().or(z.literal("")),
      email: z.string().trim().email(t("users.validation.emailRequired")),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9]{10,15}$/, t("users.validation.phoneInvalid"))
        .optional()
        .or(z.literal("")),
      password: z.string().min(8, t("users.validation.passwordMin")),
      confirm_password: z.string().min(8, t("users.validation.passwordMin")),
      role: z.string().min(1, t("users.validation.roleRequired")),
      is_active: z.boolean(),
      is_staff: z.boolean(),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t("users.validation.passwordMismatch"),
      path: ["confirm_password"],
    })
}

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>

export function editUserFormSchema(t: SchemaTranslator = defaultT) {
  return z.object({
    username: z
      .string()
      .trim()
      .min(3, t("users.validation.usernameRequired"))
      .regex(/^[A-Za-z0-9._-]{3,150}$/, t("users.validation.usernameFormat")),
    first_name: z.string().trim().max(150).optional().or(z.literal("")),
    last_name: z.string().trim().max(150).optional().or(z.literal("")),
    email: z.string().trim().email(t("users.validation.emailRequired")),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, t("users.validation.phoneInvalid"))
      .optional()
      .or(z.literal("")),
    role: z.string().min(1, t("users.validation.roleRequired")),
    is_active: z.boolean(),
    is_staff: z.boolean(),
  })
}

export type EditUserFormValues = z.infer<ReturnType<typeof editUserFormSchema>>

export function setPasswordFormSchema(t: SchemaTranslator = defaultT) {
  return z
    .object({
      new_password: z.string().min(8, t("users.validation.passwordMin")),
      confirm_password: z.string().min(8, t("users.validation.passwordMin")),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: t("users.validation.passwordMismatch"),
      path: ["confirm_password"],
    })
}

export type SetPasswordFormValues = z.infer<ReturnType<typeof setPasswordFormSchema>>
