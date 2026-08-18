import type { ReactNode } from "react"
import { MotionConfig } from "framer-motion"

import AxiosProvider from "../../shared/api/AxiosProvider"
import QueryProvider from "../../shared/api/QueryProvider"
import { ToastProvider } from "../../components/ui/toast"
import { AuthProvider } from "../../features/auth/services/AuthProvider"
import LanguageProvider from "../language/LanguageProvider"
import ThemeProvider from "../theme/ThemeProvider"
import ErrorBoundary from "./ErrorBoundary"

/**
 * Root application providers.
 *
 * Composition order:
 * 1. ErrorBoundary  — catches render errors from everything below.
 * 2. ThemeProvider  — light / dark / system + data-theme attribute.
 * 3. MotionConfig   — one source of truth for framer-motion; honours
 *    `prefers-reduced-motion` for every animation deriving from it.
 * 4. LanguageProvider — fa/en/ar + dynamic RTL/LTR direction.
 * 5. QueryProvider  — @tanstack/react-query client.
 * 6. AxiosProvider  — axios instance + global loading/error state.
 * 7. AuthProvider   — authentication state (user, session status).
 * 8. ToastProvider  — toast notifications (renders its own viewport).
 *
 * The RouterProvider lives inside the router (AppRouter) so that every
 * route tree inherits these providers.
 */
export default function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <LanguageProvider>
            <QueryProvider>
              <AxiosProvider>
                <AuthProvider>
                  <ToastProvider>{children}</ToastProvider>
                </AuthProvider>
              </AxiosProvider>
            </QueryProvider>
          </LanguageProvider>
        </MotionConfig>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
