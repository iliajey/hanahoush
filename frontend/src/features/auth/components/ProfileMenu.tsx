import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useLogout } from "../hooks/useLogout"
import { useUser } from "../hooks/useUser"
import { getDisplayName } from "../utils"

import { UserAvatar } from "./UserAvatar"

/** User dropdown: identity, navigation shortcuts and logout. */
export function ProfileMenu() {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useUser()
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()

  if (!isAuthenticated || !user) return null

  const handleLogout = () => {
    logout(undefined, { onSettled: () => navigate("/login") })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <UserAvatar user={user} className="h-7 w-7" />
          <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
            {getDisplayName(user)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{getDisplayName(user)}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard">
            <LayoutDashboard className="me-2 h-4 w-4" />
            {t("nav.dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} variant="destructive">
          <LogOut className="me-2 h-4 w-4" />
          {t("auth.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
