import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import { renderWithProviders } from "../../../../tests/setup/test-utils"
import i18n from "@/i18n"
import { RolePermissionSummary, groupRolePermissions } from "../components/RolePermissionSummary"
import type { RoleWithPermissions } from "../types"

const roles: RoleWithPermissions[] = [
  {
    id: 1,
    name: "Super Admin",
    codename: "SUPER_ADMIN",
    description: "Full access",
    is_system: true,
    permissions: [
      { codename: "users.manage", name: "Manage users", module: "accounts" },
      { codename: "articles.publish", name: "Publish articles", module: "articles" },
    ],
  },
  {
    id: 5,
    name: "Editor",
    codename: "EDITOR",
    description: "Writes articles",
    is_system: true,
    permissions: [{ codename: "articles.view", name: "View articles", module: "articles" }],
  },
]

describe("groupRolePermissions", () => {
  it("buckets codenames by module in stable order", async () => {
    await i18n.changeLanguage("en")
    const groups = groupRolePermissions(roles[0].permissions)
    expect(groups.map((group) => group.module)).toEqual(["accounts", "articles"])
  })
})

describe("RolePermissionSummary", () => {
  it("shows the selected role's grouped permissions and the authoritative note", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<RolePermissionSummary roleCodename="EDITOR" roles={roles} />)
    expect(screen.getByText("Editor")).toBeInTheDocument()
    expect(screen.getByText("articles.view")).toBeInTheDocument()
    expect(screen.getByText(/authoritative/)).toBeInTheDocument()
  })

  it("warns before assigning SUPER_ADMIN", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<RolePermissionSummary roleCodename="SUPER_ADMIN" roles={roles} />)
    expect(screen.getByText(/SUPER_ADMIN grants every permission/)).toBeInTheDocument()
  })
})
