import { Link, NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink, LogOut, type LucideIcon } from "lucide-react"

import { useUser } from "@/features/auth/hooks/useUser"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { UserAvatar } from "@/features/auth/components/UserAvatar"
import { getDisplayName } from "@/features/auth/utils"
import { getRoleDefinition } from "@/features/auth/role-config"
import { BrandLogo } from "@/components/brand/BrandLogo"
import { cn } from "@/shared/lib/cn"
import {
  workspaceNavForUser,
  workspaceRouteHref,
  type WorkspaceRouteMeta,
  type WorkspaceSectionMeta,
} from "@/app/workspace/workspaceConfig"

function NavSection({ section }: { section: WorkspaceSectionMeta }) {
  const { t } = useTranslation()
  return (
    <div className="px-2">
      <p className="px-3 pb-1 pt-4 text-xs font-semibold tracking-wide text-muted-foreground">{t(section.labelKey)}</p>
    </div>
  )
}

function NavItem({
  item,
  onNavigate,
}: {
  item: WorkspaceRouteMeta
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const Icon: LucideIcon = item.icon
  const href = workspaceRouteHref(item)
  return (
    <NavLink
      to={href}
      end={href === "/dashboard"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate">{t(item.labelKey)}</span>
    </NavLink>
  )
}

interface StaffSidebarProps {
  onNavigate?: () => void
}

/** Role-aware staff sidebar. Generated from workspace route metadata only —
 * permission logic lives in workspaceConfig, not here. */
export function StaffSidebar({ onNavigate }: StaffSidebarProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const groups = workspaceNavForUser(user)
  const role = user?.role ? getRoleDefinition(user.role.codename) : null

  return (
    <div className="flex h-full flex-col border-e bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 rounded-md text-sm font-bold tracking-tight"
          onClick={onNavigate}
        >
          <BrandLogo alt={t("app.title")} className="h-7 w-auto" eager />
          <span className="hidden lg:inline">{t("app.title")}</span>
        </Link>
        <span className="ms-auto hidden rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
          {t("navWorkspace.label")}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="py-2" aria-label={t("navWorkspace.main")}>
          {groups.map((group) => (
            <div key={group.section.key}>
              <NavSection section={group.section} />
              {group.items.map((item) => (
                <NavItem key={item.path} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {user ? (
        <div className="border-t p-3">
          <Link
            to="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
          >
            <UserAvatar user={user} className="h-8 w-8" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
              <p className="truncate text-xs text-muted-foreground">{role ? t(role.nameKey) : user.username}</p>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export function StaffLayoutTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation()
  const { user } = useUser()
  const { mutate: logout } = useLogout()
  const role = user?.role ? getRoleDefinition(user.role.codename) : null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-md p-2 hover:bg-accent lg:hidden"
        aria-label={t("navWorkspace.openMenu")}
      >
        <MenuIcon />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{role ? t(role.workspaceTitleKey) : t("navWorkspace.dashboard")}</p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{user?.email}</p>
      </div>
      <div className="ms-auto flex items-center gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("navWorkspace.viewSite")}</span>
        </Link>
        <button
          type="button"
          onClick={() => logout(undefined, {})}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-destructive hover:bg-accent"
          aria-label={t("navWorkspace.logout")}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("navWorkspace.logout")}</span>
        </button>
      </div>
    </header>
  )
}

function MenuIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}