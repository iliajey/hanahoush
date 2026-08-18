import { createElement, lazy, type ComponentType } from "react"
import { createBrowserRouter, type RouteObject } from "react-router-dom"

import { AppLayout } from "../layouts/AppLayout"
import { StaffLayout } from "../layouts/StaffLayout"
import { GuestRoute } from "../../features/auth/components/GuestRoute"
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute"
import {
  RequireAnyPermission,
  RequirePermission,
  RequireStaff,
} from "../../features/auth/guards"
import { PERMISSIONS } from "../../features/auth/permissions"
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

// Phase 9G staff workspace (role-aware).
const DashboardPage = lazyPage(() =>
  import("@/features/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
)
const EditorialWorkspaceHub = lazyPage(() =>
  import("@/features/editorial/pages/EditorialWorkspaceHub").then((m) => ({ default: m.EditorialWorkspaceHub })),
)
const WorkflowDetailWorkspacePage = lazyPage(() =>
  import("@/features/editorial/pages/WorkflowDetailWorkspacePage").then((m) => ({ default: m.WorkflowDetailWorkspacePage })),
)
const ArticlesWorkspacePage = lazyPage(() =>
  import("@/features/articles/workspace/ArticlesWorkspacePage").then((m) => ({ default: m.ArticlesWorkspacePage })),
)
const ArticleEditPage = lazyPage(() =>
  import("@/features/articles/workspace/ArticleEditPage").then((m) => ({ default: m.ArticleEditPage })),
)
const ProjectsWorkspacePage = lazyPage(() =>
  import("@/features/projects/workspace/ProjectsWorkspacePage").then((m) => ({ default: m.ProjectsWorkspacePage })),
)
const ProjectEditPage = lazyPage(() =>
  import("@/features/projects/workspace/ProjectEditPage").then((m) => ({ default: m.ProjectEditPage })),
)
const MediaWorkspacePage = lazyPage(() =>
  import("@/features/media/workspace/MediaWorkspacePage").then((m) => ({ default: m.MediaWorkspacePage })),
)
const ContactWorkspacePage = lazyPage(() =>
  import("@/features/contact/workspace/ContactWorkspacePage").then((m) => ({ default: m.ContactWorkspacePage })),
)
const NewsletterWorkspacePage = lazyPage(() =>
  import("@/features/newsletter/workspace/NewsletterWorkspacePage").then((m) => ({ default: m.NewsletterWorkspacePage })),
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
 * Centralized route table (Phase 6 auth; Phase 8H lazy routes; Phase 9D dev
 * surfaces removed from production; Phase 9G role-aware staff workspace).
 *
 * Every staff route is wrapped in an authorization guard AND nested inside
 * StaffLayout. Guards reuse the same centralized permission catalog as the
 * sidebar (workspaceConfig), so navigation and route protection can never
 * drift apart. Public marketing routes are untouched.
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

      // Staff workspace (Phase 9G): role-aware dashboard + management pages.
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: "editorial",
            element: (
              <RequirePermission permissions={[PERMISSIONS.EDITORIAL_VIEW]}>
                <EditorialWorkspaceHub />
              </RequirePermission>
            ),
          },
          {
            path: "editorial/:workflowId",
            element: (
              <RequirePermission permissions={[PERMISSIONS.EDITORIAL_VIEW]}>
                <WorkflowDetailWorkspacePage />
              </RequirePermission>
            ),
          },
          {
            path: "articles",
            element: (
              <RequireAnyPermission permissions={[PERMISSIONS.ARTICLES_VIEW]} staffOnly>
                <ArticlesWorkspacePage />
              </RequireAnyPermission>
            ),
          },
          {
            path: "articles/new",
            element: (
              <RequirePermission permissions={[PERMISSIONS.ARTICLES_UPDATE]} staffOnly>
                <ArticleEditPage />
              </RequirePermission>
            ),
          },
          {
            path: "articles/:id/edit",
            element: (
              <RequirePermission permissions={[PERMISSIONS.ARTICLES_UPDATE]} staffOnly>
                <ArticleEditPage />
              </RequirePermission>
            ),
          },
          {
            path: "projects",
            element: (
              <RequireAnyPermission permissions={[PERMISSIONS.PROJECTS_VIEW]} staffOnly>
                <ProjectsWorkspacePage />
              </RequireAnyPermission>
            ),
          },
          {
            path: "projects/new",
            element: (
              <RequirePermission permissions={[PERMISSIONS.PROJECTS_UPDATE]} staffOnly>
                <ProjectEditPage />
              </RequirePermission>
            ),
          },
          {
            path: "projects/:id/edit",
            element: (
              <RequirePermission permissions={[PERMISSIONS.PROJECTS_UPDATE]} staffOnly>
                <ProjectEditPage />
              </RequirePermission>
            ),
          },
          {
            path: "media",
            element: (
              <RequireAnyPermission permissions={[PERMISSIONS.MEDIA_UPLOAD, PERMISSIONS.MEDIA_MANAGE]} staffOnly>
                <MediaWorkspacePage />
              </RequireAnyPermission>
            ),
          },
          {
            path: "contact",
            element: (
              <RequireStaff>
                <ContactWorkspacePage />
              </RequireStaff>
            ),
          },
          {
            path: "newsletter",
            element: (
              <RequireStaff>
                <NewsletterWorkspacePage />
              </RequireStaff>
            ),
          },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]

export default createBrowserRouter(routes)