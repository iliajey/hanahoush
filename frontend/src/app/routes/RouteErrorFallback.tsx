import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo/useSeoMeta"

/**
 * Route-level error boundary (Phase 8H): renders a polished, localized,
 * accessible fallback for router errors (404 routes, loader/rendering errors).
 * The `*` catch-all still uses <NotFoundPage /> for unknown paths.
 */
export function RouteErrorFallback() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  useSeoMeta({ title: is404 ? t("notFound.title") : t("errors.unexpected"), robots: "noindex,follow" }, language)

  return (
    <PageWrapper>
      <ErrorState
        className="py-20"
        title={is404 ? t("notFound.title") : t("errors.unexpected")}
        description={is404 ? t("notFound.description") : t("errors.routeFallbackDescription")}
      >
        <Button asChild>
          <Link to="/">{t("nav.home")}</Link>
        </Button>
      </ErrorState>
    </PageWrapper>
  )
}