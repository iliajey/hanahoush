import { createElement, lazy, type ComponentType } from "react"
import { createBrowserRouter, type RouteObject } from "react-router-dom"

import { AppLayout } from "../layouts/AppLayout"
import { GuestRoute } from "../../features/auth/components/GuestRoute"
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute"
import { RouteErrorFallback } from "./RouteErrorFallback"

/**
 * Route-level code splitting (Phase 8H): every public/auth/protected page is
 * dynamically imported so the initial bundle only contains the app shell
 * (layout, nav, footer) + the active page. Page-builder sections were already
 * lazy; this extends the same strategy to whole routes. The <Suspense>
 * boundary lives in <AppLayout /> around <Outlet />.
 */
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  return lazy(loader)
}

/** Render a lazy component for use as a route element. */
function lazyElement(loader: () => Promise<{ default: ComponentType }>) {
  return createElement(lazyPage(loader))
}

const HomePage = lazyPage(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })))
const ServicesPage = lazyPage(() => import("./pages/ServicesPage").then((m) => ({ default: m.ServicesPage })))
const AboutPage = lazyPage(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })))
const ContactPage = lazyPage(() => import("./pages/ContactPage").then((m) => ({ default: m.ContactPage })))
const SearchPage = lazyPage(() => import("@/features/search/pages/SearchPage").then((m) => ({ default: m.SearchPage })))
const ProjectsPage = lazyPage(() =>
  import("@/features/projects/pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
)
const ProjectCaseStudyPage = lazy(async () => {
  const m = await import("@/features/projects/pages/ProjectCaseStudyPage")
  return { default: m.ProjectCaseStudyPage }
})
const ArticlesPage = lazyPage(() =>
  import("@/features/articles/pages/ArticlesPage").then((m) => ({ default: m.ArticlesPage })),
)
const ArticleDetailPage = lazyPage(() =>
  import("@/features/articles/pages/ArticleDetailPage").then((m) => ({ default: m.ArticleDetailPage })),
)
const NotFoundPage = lazyPage(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })))
const DashboardPage = lazyPage(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })))
const LoginPage = lazyPage(() =>
  import("../../features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
)
const ForgotPasswordPage = lazyPage(() =>
  import("../../features/auth/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazyPage(() =>
  import("../../features/auth/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
)
const SessionExpiredPage = lazyPage(() =>
  import("../../features/auth/pages/SessionExpiredPage").then((m) => ({ default: m.SessionExpiredPage })),
)
const UnauthorizedPage = lazyPage(() =>
  import("../../features/auth/pages/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage })),
)

/**
 * Development-only surfaces (design laboratory + marketing/dev consoles).
 *
 * These are only registered when `import.meta.env.DEV` is true. In a
 * production build Vite replaces that with `false`, the branches are
 * constant-folded away and the dynamic `import()` factories are never
 * referenced — so none of this code contributes to the shipped bundle and
 * every /design and /dev/* path falls through to the 404 catch-all.
 */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      { path: "design", element: lazyElement(() => import("./pages/DesignPlayground").then((m) => ({ default: m.DesignPlayground }))) },
      { path: "dev/marketing", element: lazyElement(() => import("./pages/MarketingPreview").then((m) => ({ default: m.MarketingPreview }))) },
      { path: "dev/api", element: lazyElement(() => import("@/features/cms/dev").then((m) => ({ default: m.ApiDevPage }))) },
      { path: "dev/page-builder", element: lazyElement(() => import("@/features/page-builder/dev").then((m) => ({ default: m.PageBuilderDevPage }))) },
      { path: "dev/editorial", element: lazyElement(() => import("@/features/editorial/dev").then((m) => ({ default: m.EditorialDevPage }))) },
      { path: "dev/services", element: lazyElement(() => import("@/features/services").then((m) => ({ default: m.ServicesDevPage }))) },
      { path: "dev/projects", element: lazyElement(() => import("@/features/projects").then((m) => ({ default: m.ProjectsDevPage }))) },
      { path: "dev/articles", element: lazyElement(() => import("@/features/articles").then((m) => ({ default: m.ArticlesDevPage }))) },
      { path: "dev/media", element: lazyElement(() => import("@/features/media/dev").then((m) => ({ default: m.MediaDevPage }))) },
    ]
  : []

/**
 * Centralized route table (Phase 6: authentication added; Phase 8H: search +
 * lazy routes; Phase 9D: development surfaces removed from production).
 *
 * All business pages are fully implemented — no placeholders remain.
 * Protected routes are wrapped in <ProtectedRoute />, guest-only routes
 * (login, password reset) in <GuestRoute />.
 */
const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:slug", element: <ProjectCaseStudyPage /> },
      { path: "articles", element: <ArticlesPage /> },
      { path: "articles/:slug", element: <ArticleDetailPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "search", element: <SearchPage /> },

      // Development-only design laboratory + marketing library
      ...devRoutes,

      // Authentication
      {
        path: "login",
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        ),
      },
      { path: "unauthorized", element: <UnauthorizedPage /> },
      { path: "session-expired", element: <SessionExpiredPage /> },

      // Protected area
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]

export default createBrowserRouter(routes)