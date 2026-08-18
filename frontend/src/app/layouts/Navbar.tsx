import { useEffect, useRef } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LogOut, Menu, Search, X } from "lucide-react"
import { useState } from "react"

import { useLanguage } from "@/shared/hooks"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Container } from "@/components/layout"
import { cn } from "@/shared/lib/cn"
import { ProfileMenu } from "@/features/auth/components/ProfileMenu"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { useUser } from "@/features/auth/hooks/useUser"
import { getDisplayName } from "@/features/auth/utils"
import { useNavigation, useSiteSettings } from "@/features/cms"
import { SearchCommand } from "@/features/search"

/**
 * App navigation. CMS pages (services/projects/articles/about) are driven by
 * the navigation endpoint (localized by the backend); Home + auth chrome are
 * app-level and remain in i18n. Falls back to i18n labels while loading.
 *
 * Mobile drawer covers the same actions as the desktop bar (search, theme,
 * authenticated menu, login/logout) so no feature requires a larger viewport.
 * The drawer is keyboard-accessible: Escape closes it and focus returns to the
 * toggle button.
 */
export function Navbar() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated, user } = useUser()
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const navigation = useNavigation()
  const settings = useSiteSettings()

  const cmsItems =
    navigation.data?.items.map((item) => ({ to: item.href, label: item.label, end: false })) ?? []

  const navItems = [
    { to: "/", label: t("nav.home"), end: true },
    ...cmsItems,
  ]

  const brandName = settings.data?.site_name || t("app.title")

  const handleLogout = () => {
    logout(undefined, { onSettled: () => navigate("/login") })
  }

  // Close the drawer on Escape and return focus to the toggle button.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const drawerItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
      isActive && "bg-accent text-accent-foreground",
    )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight" onClick={() => setOpen(false)}>
          {settings.data?.logo?.file ? (
            <img
              src={settings.data.logo.file}
              alt={brandName}
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-950 text-sm font-black text-white shadow-sm">
              ه
            </span>
          )}
          <span className="text-lg">{brandName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t("nav.main")}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SearchCommand className="hidden sm:inline-flex" />
          <ThemeToggle className="hidden sm:inline-flex" />
          <LanguageToggle />
          {isAuthenticated ? (
            <ProfileMenu />
          ) : (
            <Link
              to="/login"
              className="hidden rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:block"
            >
              {t("nav.login")}
            </Link>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="rounded-md p-2 hover:bg-accent md:hidden"
            aria-label={t("nav.toggleMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <nav id="mobile-nav" className="border-t bg-background md:hidden" aria-label={t("nav.toggleMenu")}>
          <Container className="flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={drawerItemClass}
              >
                {item.label}
              </NavLink>
            ))}

            <NavLink to="/search" onClick={() => setOpen(false)} className={drawerItemClass}>
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" aria-hidden="true" />
                {t("nav.search")}
              </span>
            </NavLink>

            <div className="mt-2 flex items-center justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">{t("app.toggleTheme")}</span>
              <ThemeToggle />
            </div>

            {isAuthenticated && user ? (
              <div className="mt-1 flex flex-col gap-1 border-t pt-2">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <NavLink to="/dashboard" onClick={() => setOpen(false)} className={drawerItemClass}>
                  {t("nav.dashboard")}
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-start text-sm font-medium text-destructive hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-primary">
                {t("nav.login")}
              </Link>
            )}
          </Container>
        </nav>
      ) : null}

      {/* Keep `language` referenced so the header re-renders on direction change. */}
      <span className="sr-only">{language}</span>
    </header>
  )
}
