/** Staff workspace configuration (Phase 9G).
 *
 * Single source of truth for the staff workspace: every route's access
 * requirements AND its sidebar link are derived from these definitions.
 * Components never re-implement permission logic — they filter the same
 * metadata with {@link canAccessWorkspaceRoute}.
 *
 * Capabilities come from the role-config module (permission catalog +
 * is_staff gate). The backend remains the authoritative security boundary.
 */
import type { LucideIcon } from "lucide-react"
import {
  FileText,
  FolderKanban,
  Images,
  LayoutDashboard,
  Mail,
  MessagesSquare,
  NotebookPen,
} from "lucide-react"

import { CAPABILITIES, type CapabilityKey } from "@/features/auth/role-config"
import { canUseCapability } from "@/features/auth/role-config"
import type { UserProfile } from "@/features/auth/types"

export type WorkspaceSectionKey = "dashboard" | "content" | "editorial" | "media" | "communication"

export interface WorkspaceSectionMeta {
  key: WorkspaceSectionKey
  labelKey: string
}

export interface WorkspaceRouteMeta {
  /** Route path relative to `/dashboard` (react-router children paths). */
  path: string
  labelKey: string
  descriptionKey: string
  icon: LucideIcon
  section: WorkspaceSectionKey
  capability: CapabilityKey
  /** Show an entry in the staff sidebar (detail routes stay hidden). */
  inNav: boolean
}

export const WORKSPACE_SECTIONS: readonly WorkspaceSectionMeta[] = [
  { key: "dashboard", labelKey: "navWorkspace.dashboard" },
  { key: "content", labelKey: "navWorkspace.content" },
  { key: "editorial", labelKey: "navWorkspace.editorial" },
  { key: "media", labelKey: "navWorkspace.media" },
  { key: "communication", labelKey: "navWorkspace.communication" },
] as const

export const WORKSPACE_ROUTES: readonly WorkspaceRouteMeta[] = [
  {
    path: "",
    labelKey: "navWorkspace.dashboard",
    descriptionKey: "navWorkspace.dashboardDescription",
    icon: LayoutDashboard,
    section: "dashboard",
    capability: CAPABILITIES.DASHBOARD,
    inNav: true,
  },
  {
    path: "articles",
    labelKey: "navWorkspace.articles",
    descriptionKey: "navWorkspace.articlesDescription",
    icon: FileText,
    section: "content",
    capability: CAPABILITIES.CONTENT_ARTICLES,
    inNav: true,
  },
  {
    path: "projects",
    labelKey: "navWorkspace.projects",
    descriptionKey: "navWorkspace.projectsDescription",
    icon: FolderKanban,
    section: "content",
    capability: CAPABILITIES.CONTENT_PROJECTS,
    inNav: true,
  },
  {
    path: "editorial",
    labelKey: "navWorkspace.editorial",
    descriptionKey: "navWorkspace.editorialDescription",
    icon: NotebookPen,
    section: "editorial",
    capability: CAPABILITIES.EDITORIAL,
    inNav: true,
  },
  {
    path: "editorial/:workflowId",
    labelKey: "navWorkspace.workflowDetail",
    descriptionKey: "navWorkspace.workflowDetailDescription",
    icon: NotebookPen,
    section: "editorial",
    capability: CAPABILITIES.EDITORIAL,
    inNav: false,
  },
  {
    path: "media",
    labelKey: "navWorkspace.media",
    descriptionKey: "navWorkspace.mediaDescription",
    icon: Images,
    section: "media",
    capability: CAPABILITIES.MEDIA_LIBRARY,
    inNav: true,
  },
  {
    path: "contact",
    labelKey: "navWorkspace.contact",
    descriptionKey: "navWorkspace.contactDescription",
    icon: MessagesSquare,
    section: "communication",
    capability: CAPABILITIES.CONTACT_MANAGE,
    inNav: true,
  },
  {
    path: "newsletter",
    labelKey: "navWorkspace.newsletter",
    descriptionKey: "navWorkspace.newsletterDescription",
    icon: Mail,
    section: "communication",
    capability: CAPABILITIES.NEWSLETTER_MANAGE,
    inNav: true,
  },
]

/** True when the authenticated user may access a workspace route. */
export function canAccessWorkspaceRoute(user: UserProfile | null | undefined, meta: WorkspaceRouteMeta): boolean {
  return canUseCapability(user, meta.capability)
}

/** Absolute href for a workspace route (the index maps to `/dashboard`). */
export function workspaceRouteHref(meta: WorkspaceRouteMeta): string {
  return meta.path ? `/dashboard/${meta.path}` : "/dashboard"
}

/** Sidebar items for the current user, grouped by section. */
export function workspaceNavForUser(
  user: UserProfile | null | undefined,
): { section: WorkspaceSectionMeta; items: WorkspaceRouteMeta[] }[] {
  return WORKSPACE_SECTIONS.map((section) => ({
    section,
    items: WORKSPACE_ROUTES.filter((meta) => meta.inNav && meta.section === section.key && canAccessWorkspaceRoute(user, meta)),
  })).filter((group) => group.items.length > 0)
}