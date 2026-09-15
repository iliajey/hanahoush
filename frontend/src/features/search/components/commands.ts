import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Briefcase,
  Images,
  CalendarClock,
  Users,
  User,
  Plus,
  Upload,
  Inbox,
  Moon,
  Languages,
  Keyboard,
} from "lucide-react"

import { CAPABILITIES, canUseCapability, type CapabilityKey } from "@/features/auth/role-config"
import type { UserProfile } from "@/features/auth/types"

export type CommandCategory = "navigation" | "create" | "content" | "publishing" | "admin" | "system"

export interface CommandItem {
  id: string
  category: CommandCategory
  labelKey: string
  hintKey?: string
  href?: string
  icon: LucideIcon
  capability?: CapabilityKey
  action?: "theme" | "language" | "shortcuts" | "profile"
}

const ALL: CommandItem[] = [
  { id: "nav-dashboard", category: "navigation", labelKey: "commandCenter.nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "nav-articles", category: "content", labelKey: "commandCenter.nav.articles", href: "/dashboard/articles", icon: FileText, capability: CAPABILITIES.CONTENT_ARTICLES },
  { id: "nav-projects", category: "content", labelKey: "commandCenter.nav.projects", href: "/dashboard/projects", icon: FolderKanban, capability: CAPABILITIES.CONTENT_PROJECTS },
  { id: "nav-services", category: "content", labelKey: "commandCenter.nav.services", href: "/dashboard/services", icon: Briefcase, capability: CAPABILITIES.CONTENT_SERVICES },
  { id: "nav-media", category: "navigation", labelKey: "commandCenter.nav.media", href: "/dashboard/media", icon: Images, capability: CAPABILITIES.MEDIA_LIBRARY },
  { id: "nav-timeline", category: "navigation", labelKey: "commandCenter.nav.timeline", href: "/dashboard/timeline", icon: CalendarClock, capability: CAPABILITIES.EDITORIAL },
  { id: "nav-editorial", category: "navigation", labelKey: "commandCenter.nav.editorial", href: "/dashboard/editorial", icon: Inbox, capability: CAPABILITIES.EDITORIAL },
  { id: "nav-users", category: "admin", labelKey: "commandCenter.nav.users", href: "/dashboard/users", icon: Users, capability: CAPABILITIES.USER_MANAGE },
  { id: "nav-profile", category: "system", labelKey: "commandCenter.nav.profile", href: "/dashboard/profile", icon: User, action: "profile" },
  { id: "create-article", category: "create", labelKey: "commandCenter.create.article", href: "/dashboard/articles/new", icon: Plus, capability: CAPABILITIES.CONTENT_ARTICLES_WRITE },
  { id: "create-project", category: "create", labelKey: "commandCenter.create.project", href: "/dashboard/projects/new", icon: Plus, capability: CAPABILITIES.CONTENT_PROJECTS_WRITE },
  { id: "create-service", category: "create", labelKey: "commandCenter.create.service", href: "/dashboard/services/new", icon: Plus, capability: CAPABILITIES.CONTENT_SERVICES_WRITE },
  { id: "create-media", category: "create", labelKey: "commandCenter.create.media", href: "/dashboard/media", icon: Upload, capability: CAPABILITIES.MEDIA_UPLOAD },
  { id: "pub-attention", category: "publishing", labelKey: "commandCenter.pub.attention", href: "/dashboard/timeline?bucket=attention", icon: Inbox, capability: CAPABILITIES.EDITORIAL },
  { id: "pub-timeline", category: "publishing", labelKey: "commandCenter.pub.timeline", href: "/dashboard/timeline", icon: CalendarClock, capability: CAPABILITIES.EDITORIAL },
  { id: "sys-theme", category: "system", labelKey: "commandCenter.system.theme", icon: Moon, action: "theme" },
  { id: "sys-language", category: "system", labelKey: "commandCenter.system.language", icon: Languages, action: "language" },
  { id: "sys-shortcuts", category: "system", labelKey: "commandCenter.system.shortcuts", icon: Keyboard, action: "shortcuts" },
]

export function commandsForUser(user: UserProfile | null | undefined): CommandItem[] {
  return ALL.filter((c) => (c.capability ? canUseCapability(user, c.capability) : true))
}

export function filterCommands(commands: CommandItem[], q: string, t: (k: string) => string): CommandItem[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return commands
  return commands.filter((c) => t(c.labelKey).toLowerCase().includes(needle))
}
