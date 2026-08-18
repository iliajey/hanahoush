import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { canUseCapability, CAPABILITIES } from "../role-config"
import { roleUsers } from "./fixtures"

/** Action-level permission rules used by the workspaces — assertions over the
 * centralized capability layer (not scattered component checks). */
describe("action authorization per workspace", () => {
  it("articles: only staff with editorial.manage can move content through the pipeline", () => {
    const cm = roleUsers.CONTENT_MANAGER
    const editor = roleUsers.EDITOR
    expect(canUseCapability(cm, CAPABILITIES.CONTENT_ARTICLES_WRITE)).toBe(true)
    expect(canUseCapability(cm, CAPABILITIES.EDITORIAL_MANAGE)).toBe(true)
    // Editor can author (has articles.* perms) but the write surface is staff-only.
    expect(canUseCapability(editor, CAPABILITIES.CONTENT_ARTICLES_WRITE)).toBe(false)
    expect(canUseCapability(editor, CAPABILITIES.EDITORIAL_MANAGE)).toBe(false)
    // Editorial approval is gated further.
    expect(canUseCapability(cm, CAPABILITIES.EDITORIAL_APPROVE)).toBe(false)
  })

  it("projects: PROJECT_MANAGER and COMPANY_ADMIN can manage; EDITOR/VIEWER cannot", () => {
    expect(canUseCapability(roleUsers.PROJECT_MANAGER, CAPABILITIES.CONTENT_PROJECTS_WRITE)).toBe(true)
    expect(canUseCapability(roleUsers.COMPANY_ADMIN, CAPABILITIES.CONTENT_PROJECTS_WRITE)).toBe(true)
    expect(canUseCapability(roleUsers.EDITOR, CAPABILITIES.CONTENT_PROJECTS_WRITE)).toBe(false)
    expect(canUseCapability(roleUsers.VIEWER, CAPABILITIES.CONTENT_PROJECTS_WRITE)).toBe(false)
  })

  it("media: uploads are staff-gated; manage (metadata/delete) requires media.manage", () => {
    const cm = roleUsers.CONTENT_MANAGER
    const pm = roleUsers.PROJECT_MANAGER
    const editor = roleUsers.EDITOR
    expect(canUseCapability(cm, CAPABILITIES.MEDIA_UPLOAD)).toBe(true)
    expect(canUseCapability(cm, CAPABILITIES.MEDIA_MANAGE)).toBe(false)
    expect(canUseCapability(pm, CAPABILITIES.MEDIA_UPLOAD)).toBe(true)
    // Editor has media.upload in the catalog but is non-staff → no library.
    expect(canUseCapability(editor, CAPABILITIES.MEDIA_LIBRARY)).toBe(false)
    expect(canUseCapability(roleUsers.VIEWER, CAPABILITIES.MEDIA_LIBRARY)).toBe(false)
  })

  it("contact + newsletter are staff-only (no dedicated codename in the catalog)", () => {
    for (const role of Object.values(roleUsers)) {
      const expected = role.is_staff
      expect(canUseCapability(role, CAPABILITIES.CONTACT_MANAGE), role.username).toBe(expected)
      expect(canUseCapability(role, CAPABILITIES.NEWSLETTER_MANAGE), role.username).toBe(expected)
    }
  })

  it("editorial review actions are capability-gated per role", () => {
    const cm = roleUsers.CONTENT_MANAGER
    const pm = roleUsers.PROJECT_MANAGER
    const viewer = roleUsers.VIEWER
    expect(canUseCapability(cm, CAPABILITIES.EDITORIAL_REVIEW)).toBe(true)
    expect(canUseCapability(pm, CAPABILITIES.EDITORIAL_REVIEW)).toBe(true)
    expect(canUseCapability(viewer, CAPABILITIES.EDITORIAL_REVIEW)).toBe(false)
  })
})

/** Privacy guard: the staff newsletter client must never reference the
 * unsubscribe token (backend guarantees it is not serialized). */
describe("newsletter privacy", () => {
  it("the newsletter feature never references unsubscribe_token in source", () => {
    const featureRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../features/newsletter")
    const sources = ["api.ts", "types.ts", "hooks.ts", "workspace/NewsletterWorkspacePage.tsx"]
    for (const file of sources) {
      const source = readFileSync(resolve(featureRoot, file), "utf8")
      expect(source.includes("unsubscribe_token"), `${file} leaks the token`).toBe(false)
    }
  })
})