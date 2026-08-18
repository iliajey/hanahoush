import { describe, expect, it } from "vitest"

import { CAPABILITIES, canUseCapability, grantedCapabilities } from "../role-config"
import { canAccessWorkspaceRoute, WORKSPACE_ROUTES, workspaceNavForUser } from "@/app/workspace/workspaceConfig"
import { hasPermission } from "../permissions"
import { PERMISSIONS } from "../permissions"

import { roleUsers, superuserAdmin } from "./fixtures"

/** Expected capability matrix per role — derived from the backend permission
 * catalog + the is_staff gate (the two sources of truth). */
const EXPECTED: Record<string, Record<string, boolean>> = {
  SUPER_ADMIN: Object.fromEntries(Object.values(CAPABILITIES).map((capability) => [capability, true])),
  COMPANY_ADMIN: {
    [CAPABILITIES.DASHBOARD]: true,
    [CAPABILITIES.CONTENT_ARTICLES]: true,
    [CAPABILITIES.CONTENT_PROJECTS]: true,
    [CAPABILITIES.CONTENT_ARTICLES_WRITE]: true,
    [CAPABILITIES.CONTENT_PROJECTS_WRITE]: true,
    [CAPABILITIES.EDITORIAL]: true,
    [CAPABILITIES.EDITORIAL_REVIEW]: false,
    [CAPABILITIES.EDITORIAL_MANAGE]: true,
    [CAPABILITIES.EDITORIAL_APPROVE]: true,
    [CAPABILITIES.EDITORIAL_SCHEDULE]: true,
    [CAPABILITIES.MEDIA_LIBRARY]: true,
    [CAPABILITIES.MEDIA_UPLOAD]: true,
    [CAPABILITIES.MEDIA_MANAGE]: true,
    [CAPABILITIES.CONTACT_MANAGE]: true,
    [CAPABILITIES.NEWSLETTER_MANAGE]: true,
    [CAPABILITIES.ANALYTICS]: true,
    [CAPABILITIES.SYSTEM]: true,
  },
  CONTENT_MANAGER: {
    [CAPABILITIES.DASHBOARD]: true,
    [CAPABILITIES.CONTENT_ARTICLES]: true,
    [CAPABILITIES.CONTENT_PROJECTS]: false,
    [CAPABILITIES.CONTENT_ARTICLES_WRITE]: true,
    [CAPABILITIES.CONTENT_PROJECTS_WRITE]: false,
    [CAPABILITIES.EDITORIAL]: true,
    [CAPABILITIES.EDITORIAL_REVIEW]: true,
    [CAPABILITIES.EDITORIAL_MANAGE]: true,
    [CAPABILITIES.EDITORIAL_APPROVE]: false,
    [CAPABILITIES.EDITORIAL_SCHEDULE]: true,
    [CAPABILITIES.MEDIA_LIBRARY]: true,
    [CAPABILITIES.MEDIA_UPLOAD]: true,
    [CAPABILITIES.MEDIA_MANAGE]: false,
    [CAPABILITIES.CONTACT_MANAGE]: true,
    [CAPABILITIES.NEWSLETTER_MANAGE]: true,
    [CAPABILITIES.ANALYTICS]: true,
    [CAPABILITIES.SYSTEM]: true,
  },
  PROJECT_MANAGER: {
    [CAPABILITIES.DASHBOARD]: true,
    [CAPABILITIES.CONTENT_ARTICLES]: true,
    [CAPABILITIES.CONTENT_PROJECTS]: true,
    [CAPABILITIES.CONTENT_ARTICLES_WRITE]: false,
    [CAPABILITIES.CONTENT_PROJECTS_WRITE]: true,
    [CAPABILITIES.EDITORIAL]: true,
    [CAPABILITIES.EDITORIAL_REVIEW]: true,
    [CAPABILITIES.EDITORIAL_MANAGE]: false,
    [CAPABILITIES.EDITORIAL_APPROVE]: false,
    [CAPABILITIES.EDITORIAL_SCHEDULE]: false,
    [CAPABILITIES.MEDIA_LIBRARY]: true,
    [CAPABILITIES.MEDIA_UPLOAD]: true,
    [CAPABILITIES.MEDIA_MANAGE]: false,
    [CAPABILITIES.CONTACT_MANAGE]: true,
    [CAPABILITIES.NEWSLETTER_MANAGE]: true,
    [CAPABILITIES.ANALYTICS]: false,
    [CAPABILITIES.SYSTEM]: true,
  },
  EDITOR: {
    [CAPABILITIES.DASHBOARD]: true,
    [CAPABILITIES.CONTENT_ARTICLES]: false,
    [CAPABILITIES.CONTENT_PROJECTS]: false,
    [CAPABILITIES.CONTENT_ARTICLES_WRITE]: false,
    [CAPABILITIES.CONTENT_PROJECTS_WRITE]: false,
    [CAPABILITIES.EDITORIAL]: true,
    [CAPABILITIES.EDITORIAL_REVIEW]: true,
    [CAPABILITIES.EDITORIAL_MANAGE]: false,
    [CAPABILITIES.EDITORIAL_APPROVE]: false,
    [CAPABILITIES.EDITORIAL_SCHEDULE]: false,
    [CAPABILITIES.MEDIA_LIBRARY]: false,
    [CAPABILITIES.MEDIA_UPLOAD]: false,
    [CAPABILITIES.MEDIA_MANAGE]: false,
    [CAPABILITIES.CONTACT_MANAGE]: false,
    [CAPABILITIES.NEWSLETTER_MANAGE]: false,
    [CAPABILITIES.ANALYTICS]: false,
    [CAPABILITIES.SYSTEM]: false,
  },
  VIEWER: {
    [CAPABILITIES.DASHBOARD]: true,
    [CAPABILITIES.CONTENT_ARTICLES]: false,
    [CAPABILITIES.CONTENT_PROJECTS]: false,
    [CAPABILITIES.CONTENT_ARTICLES_WRITE]: false,
    [CAPABILITIES.CONTENT_PROJECTS_WRITE]: false,
    [CAPABILITIES.EDITORIAL]: true,
    [CAPABILITIES.EDITORIAL_REVIEW]: false,
    [CAPABILITIES.EDITORIAL_MANAGE]: false,
    [CAPABILITIES.EDITORIAL_APPROVE]: false,
    [CAPABILITIES.EDITORIAL_SCHEDULE]: false,
    [CAPABILITIES.MEDIA_LIBRARY]: false,
    [CAPABILITIES.MEDIA_UPLOAD]: false,
    [CAPABILITIES.MEDIA_MANAGE]: false,
    [CAPABILITIES.CONTACT_MANAGE]: false,
    [CAPABILITIES.NEWSLETTER_MANAGE]: false,
    [CAPABILITIES.ANALYTICS]: true,
    [CAPABILITIES.SYSTEM]: false,
  },
}

describe("role capability matrix (derived from backend catalog + is_staff)", () => {
  for (const [role, expected] of Object.entries(EXPECTED)) {
    it(`${role}: granted capabilities match the expected matrix`, () => {
      const user = roleUsers[role as keyof typeof roleUsers]
      for (const capability of Object.values(CAPABILITIES)) {
        expect(canUseCapability(user, capability), capability).toBe(expected[capability])
      }
    })
  }
})

describe("hasPermission against the backend catalog", () => {
  const viewer = roleUsers.VIEWER

  it("viewer reads articles but cannot manage editorial", () => {
    expect(hasPermission(viewer, PERMISSIONS.ARTICLES_VIEW)).toBe(true)
    expect(hasPermission(viewer, PERMISSIONS.ARTICLES_PUBLISH)).toBe(false)
    expect(hasPermission(viewer, PERMISSIONS.EDITORIAL_VIEW)).toBe(true)
    expect(hasPermission(viewer, PERMISSIONS.EDITORIAL_MANAGE)).toBe(false)
  })

  it("super user (admin) receives the full catalog", () => {
    expect(hasPermission(superuserAdmin, PERMISSIONS.USERS_MANAGE)).toBe(true)
    expect(hasPermission(superuserAdmin, PERMISSIONS.INTEGRATION_VIEW)).toBe(true)
  })

  it("null user has no capabilities", () => {
    expect(canUseCapability(null, CAPABILITIES.DASHBOARD)).toBe(false)
    expect(grantedCapabilities(null)).toEqual([])
  })
})

describe("route authorization (workspaceConfig)", () => {
  const routeByPath = (path: string) => {
    const meta = WORKSPACE_ROUTES.find((item) => item.path === path)
    if (!meta) throw new Error(`route not found: ${path}`)
    return meta
  }

  it("EDITOR can open editorial but not articles/media/contact/newsletter", () => {
    const editor = roleUsers.EDITOR
    expect(canAccessWorkspaceRoute(editor, routeByPath("editorial"))).toBe(true)
    expect(canAccessWorkspaceRoute(editor, routeByPath("articles"))).toBe(false)
    expect(canAccessWorkspaceRoute(editor, routeByPath("projects"))).toBe(false)
    expect(canAccessWorkspaceRoute(editor, routeByPath("media"))).toBe(false)
    expect(canAccessWorkspaceRoute(editor, routeByPath("contact"))).toBe(false)
    expect(canAccessWorkspaceRoute(editor, routeByPath("newsletter"))).toBe(false)
  })

  it("VIEWER can open editorial read-only but no management routes", () => {
    const viewer = roleUsers.VIEWER
    expect(canAccessWorkspaceRoute(viewer, routeByPath("editorial"))).toBe(true)
    expect(canAccessWorkspaceRoute(viewer, routeByPath("media"))).toBe(false)
  })

  it("PROJECT_MANAGER can open projects and articles, but not manage editorial", () => {
    const pm = roleUsers.PROJECT_MANAGER
    expect(canAccessWorkspaceRoute(pm, routeByPath("projects"))).toBe(true)
    expect(canAccessWorkspaceRoute(pm, routeByPath("articles"))).toBe(true)
    expect(canUseCapability(pm, CAPABILITIES.EDITORIAL_MANAGE)).toBe(false)
    expect(canUseCapability(pm, CAPABILITIES.EDITORIAL_APPROVE)).toBe(false)
  })

  it("CONTENT_MANAGER can open articles/media but not projects", () => {
    const cm = roleUsers.CONTENT_MANAGER
    expect(canAccessWorkspaceRoute(cm, routeByPath("articles"))).toBe(true)
    expect(canAccessWorkspaceRoute(cm, routeByPath("media"))).toBe(true)
    expect(canAccessWorkspaceRoute(cm, routeByPath("projects"))).toBe(false)
  })

  it("anonymous user cannot access any workspace route", () => {
    for (const meta of WORKSPACE_ROUTES) {
      expect(canAccessWorkspaceRoute(null, meta)).toBe(false)
    }
  })
})

describe("navigation authorization (workspaceNavForUser)", () => {
  const linkPaths = (role: string) => {
    const user = roleUsers[role as keyof typeof roleUsers]
    return workspaceNavForUser(user).flatMap((group) => group.items.map((item) => item.path)).sort()
  }

  it("SUPER_ADMIN sees every nav link", () => {
    expect(linkPaths("SUPER_ADMIN")).toEqual(["", "articles", "contact", "editorial", "media", "newsletter", "projects"])
  })

  it("VIEWER sees only dashboard + editorial", () => {
    expect(linkPaths("VIEWER")).toEqual(["", "editorial"])
  })

  it("EDITOR sees only dashboard + editorial", () => {
    expect(linkPaths("EDITOR")).toEqual(["", "editorial"])
  })

  it("PROJECT_MANAGER sees dashboard, articles, projects, editorial, media, communication", () => {
    expect(linkPaths("PROJECT_MANAGER")).toEqual(["", "articles", "contact", "editorial", "media", "newsletter", "projects"])
  })
})