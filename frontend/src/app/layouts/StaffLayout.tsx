import { Suspense, useEffect, useRef, useState } from "react"
import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Loading } from "@/components/ui/loading"
import { StaffSidebar, StaffLayoutTopbar } from "./StaffSidebar"

/**
 * Staff workspace layout (Phase 9G).
 *
 * Kept intentionally separate from the public marketing Navbar/Footer —
 * the workspace is a professional enterprise shell: a role-aware sidebar,
 * a compact top bar and the routed workspace page. Navigation is generated
 * from workspaceConfig + the authenticated user's capabilities.
 */
export function StaffLayout() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
      if (event.key === "Tab") {
        const root = menuButtonRef.current
        if (!root) return
        const focusable = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    const timer = window.setTimeout(() => {
      menuButtonRef.current?.querySelector<HTMLElement>("a[href], button")?.focus()
    }, 0)
    return () => {
      document.removeEventListener("keydown", onKey)
      window.clearTimeout(timer)
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:start-0 lg:block lg:w-64">
        <StaffSidebar />
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t("navWorkspace.openMenu")}>
          <button
            type="button"
            aria-label={t("navWorkspace.closeMenu")}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div ref={menuButtonRef} className="absolute inset-y-0 start-0 w-72 max-w-[85%] shadow-lg">
            <StaffSidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:ps-64">
        <StaffLayoutTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<Loading className="min-h-[40vh]" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}