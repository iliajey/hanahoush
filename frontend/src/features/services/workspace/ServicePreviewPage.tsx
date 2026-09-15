import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { resolveMediaUrl } from "@/shared/lib"
import { sectionIcon } from "@/features/page-builder/registry/sections/common"
import { ServiceCard, ServiceGrid } from "@/components/marketing/services"
import { ArticleContent } from "../../articles/components/ArticleContent"
import { editorStatsFor } from "../../articles/workspace/RichTextEditor"
import { useStaffService } from "../hooks/staff"
import type { StudioLocale } from "@/components/ui"

/** Staff-only draft preview (Phase 15.5): renders the saved service through
 * the same visual language as the public Services section — ServiceCard
 * (icon + title + summary) plus the full localized body. Read-only —
 * nothing here can publish. */
export function ServicePreviewPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const serviceId = id ? Number(id) : undefined
  const [previewLocale, setPreviewLocale] = useState<StudioLocale>(
    language === "fa" || language === "ar" ? language : "en",
  )

  const { data: service, isLoading, isError, refetch } = useStaffService(serviceId)

  const localized = useMemo(() => {
    if (!service) return null
    const detail = service as typeof service & {
      description_fa?: string
      description_en?: string
      description_ar?: string
      short_description_fa?: string
      short_description_en?: string
      short_description_ar?: string
    }
    const pick = (base: "title" | "description" | "short_description") =>
      (detail[`${base}_${previewLocale}` as keyof typeof detail] as string | undefined) ||
      (detail[`${base}_en` as keyof typeof detail] as string | undefined) ||
      ""
    return {
      title: pick("title") || service.slug,
      body: pick("description"),
      excerpt: pick("short_description"),
    }
  }, [service, previewLocale])

  const stats = useMemo(() => editorStatsFor(localized?.body ?? ""), [localized])
  const Icon = sectionIcon(service?.icon, 0)

  if (!Number.isFinite(serviceId)) {
    return (
      <PageWrapper title={t("servicePreview.title")}>
        <ErrorState title={t("servicePreview.notFound")} description={t("servicePreview.notFoundDescription")} />
      </PageWrapper>
    )
  }

  if (isLoading) {
    return (
      <PageWrapper title={t("servicePreview.title")}>
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !service || !localized) {
    return (
      <PageWrapper title={t("servicePreview.title")}>
        <ErrorState
          title={t("servicePreview.errorTitle")}
          description={t("servicePreview.errorDescription")}
          onRetry={() => void refetch()}
        />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={t("servicePreview.title")}
      description={t("servicePreview.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("serviceWorkspace.title"), href: "/dashboard/services" },
        { label: service.slug },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border" role="group" aria-label={t("servicePreview.localeLabel")}>
            {(["fa", "en", "ar"] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setPreviewLocale(locale)}
                aria-pressed={previewLocale === locale}
                className={`px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${previewLocale === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                {locale}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/services/${service.id}/edit`)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t("serviceWorkspace.edit")}
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("servicePreview.draftBadge")}</Badge>
          <Badge variant="secondary">{service.status_display}</Badge>
          {service.is_featured ? <Badge>{t("servicePreview.featured")}</Badge> : null}
          {service.section ? <Badge variant="outline">{service.section.title_en}</Badge> : null}
        </div>

        <Breadcrumb
          className="mb-6"
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.services"), href: "/services" },
            { label: localized.title },
          ]}
        />

        <ServiceGrid>
          <ServiceCard
            icon={<Icon className="h-5 w-5" />}
            title={localized.title}
            description={localized.excerpt || localized.body.replace(/<[^>]*>/g, "").slice(0, 160)}
            href="/services"
          />
        </ServiceGrid>

        <p className="mt-4 text-xs text-muted-foreground" dir="auto">
          {t("serviceWorkspace.wordCount", { count: stats.words })} · {t("serviceWorkspace.readingTime", { count: stats.readingMinutes })}
        </p>

        {service.cover_image ? (
          <div className="mt-8 overflow-hidden rounded-3xl border">
            <img
              src={resolveMediaUrl(service.cover_image.file) ?? service.cover_image.file}
              alt={service.cover_image.alt_text_en || localized.title}
              className="aspect-[21/9] h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="article-body prose prose-slate mt-8 max-w-none dark:prose-invert" dir={previewLocale === "en" ? "ltr" : "rtl"}>
          {localized.body ? (
            <ArticleContent html={localized.body} />
          ) : (
            <p className="text-muted-foreground">{t("servicePreview.emptyBody")}</p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/services">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t("servicePreview.backToList")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/services/${service.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("serviceWorkspace.edit")}
            </Link>
          </Button>
          {service.status === "published" ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/services" target="_blank" rel="noreferrer">
                {t("serviceWorkspace.view")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageWrapper>
  )
}
