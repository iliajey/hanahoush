import { Suspense } from "react"
import { Outlet } from "react-router-dom"

import { AnnouncementBar } from "@/features/page-builder/components/AnnouncementBar"
import { Loading } from "@/components/ui/loading"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"

/**
 * App layout — top-level chrome shared by every route.
 * Renders the (config-driven) announcement bar, Navbar, the routed page
 * (<Outlet />) and the CMS-driven Footer. Routes are code-split (Phase 8H),
 * so the outlet is wrapped in <Suspense> with a non-jumping loading fallback.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<Loading className="min-h-[40vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}