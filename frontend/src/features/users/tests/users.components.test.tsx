import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RoleSelect } from "../components/RoleSelect"
import { ConfirmActionDialog } from "../components/ConfirmActionDialog"
import type { RoleWithPermissions } from "../types"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.defaultValue) return String(options.defaultValue)
      if (options?.count != null) return `${key}:${options.count}`
      if (options?.username) return `${key}:${options.username}`
      return key
    },
  }),
}))

const ROLES: RoleWithPermissions[] = [
  {
    id: 1,
    name: "Super Admin",
    codename: "SUPER_ADMIN",
    description: "Full access",
    is_system: true,
    permissions: [
      { codename: "users.manage", name: "Manage users", module: "accounts" },
      { codename: "articles.view", name: "View articles", module: "articles" },
    ],
  },
  {
    id: 2,
    name: "Viewer",
    codename: "VIEWER",
    description: "Read only",
    is_system: true,
    permissions: [{ codename: "articles.view", name: "View articles", module: "articles" }],
  },
]

describe("RoleSelect", () => {
  it("renders the field label and surfaces the error message", () => {
    render(
      <RoleSelect
        value="VIEWER"
        onChange={() => undefined}
        roles={ROLES}
        invalid
        error="users.validation.roleRequired"
      />,
    )
    expect(screen.getByText("users.fields.role *")).toBeInTheDocument()
    expect(screen.getByText("users.validation.roleRequired")).toBeInTheDocument()
  })

  it("never renders password or token material", () => {
    const { container } = render(
      <RoleSelect value="VIEWER" onChange={() => undefined} roles={ROLES} />,
    )
    expect(container.textContent ?? "").not.toMatch(/password|token|secret/i)
  })
})

describe("ConfirmActionDialog", () => {
  it("names the affected account and confirms explicitly", async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmActionDialog
        open
        onOpenChange={onOpenChange}
        kind="deactivate"
        username="editor"
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText("users.confirm.deactivateTitle")).toBeInTheDocument()
    expect(
      screen.getByText("users.confirm.deactivateBody:editor"),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "users.actions.deactivate" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("shows the backend error verbatim and never leaks secrets", () => {
    const { container } = render(
      <ConfirmActionDialog
        open
        onOpenChange={() => undefined}
        kind="activate"
        username="viewer"
        error="Cannot deactivate the last active superuser."
        onConfirm={() => undefined}
      />,
    )
    expect(
      screen.getByText("Cannot deactivate the last active superuser."),
    ).toBeInTheDocument()
    expect(container.textContent ?? "").not.toMatch(/password|pbkdf2|token/i)
  })
})
