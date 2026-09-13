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
import { ArticleContent } from "../components/ArticleContent"
import { ArticleMeta } from "../components/RelatedContent"
import { resolveMediaUrl } from "@/shared/lib"
import { editorStatsFor } from "./RichTextEditor"
import { useStaffArticle } from "../hooks/staff"
import type { ArticleDetail } from "../types"

/** Staff-only draft preview: renders the saved article through the SAME
 * public components (ArticleContent sanitization, meta row) so the preview
 * matches the public page. Read-only — nothing here can publish. */
export function ArticlePreviewPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const articleId = id ? Number(id) : undefined
  const [previewLocale, setPreviewLocale] = useState<"fa" | "en" | "ar">(language as "fa" | "en" | "ar")

  const { data: article, isLoading, isError, refetch } = useStaffArticle(articleId)

  const localized = useMemo(() => {
    if (!article) return null
    const detail = article as unknown as ArticleDetail & {
      description_fa?: string
      description_en?: string
      description_ar?: string
      short_description_fa?: string
      short_description_en?: string
      short_description_ar?: string
    }
    const pick = (base: "title" | "description" | "short_description") =>
      (detail[`${base}_${previewLocale}` as keyof typeof detail] as string | undefined) ||
      detail[`${base}_en` as keyof typeof detail] as string | undefined ||
      ""
    return {
      title: pick("title") || article.slug,
      body: pick("description"),
      excerpt: pick("short_description"),
    }
  }, [article, previewLocale])

  const stats = useMemo(() => editorStatsFor(localized?.body ?? ""), [localized])

  if (!Number.isFinite(articleId)) {
    return (
      <PageWrapper title={t("articlePreview.title")}>
        <ErrorState title={t("articlePreview.notFound")} description={t("articlePreview.notFoundDescription")} />
      </PageWrapper>
    )
  }

  if (isLoading) {
    return (
      <PageWrapper title={t("articlePreview.title")}>
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !article || !localized) {
    return (
      <PageWrapper title={t("articlePreview.title")}>
        <ErrorState
          title={t("articlePreview.errorTitle")}
          description={t("articlePreview.errorDescription")}
          onRetry={() => void refetch()}
        />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={t("articlePreview.title")}
      description={t("articlePreview.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("articleWorkspace.title"), href: "/dashboard/articles" },
        { label: article.slug },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border" role="group" aria-label={t("articlePreview.localeLabel")}>
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
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/articles/${article.id}/edit`)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t("articleWorkspace.edit")}
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("articlePreview.draftBadge")}</Badge>
          <Badge variant="secondary">{article.status_display}</Badge>
          {article.is_featured ? <Badge>{t("articlePreview.featured")}</Badge> : null}
        </div>

        <Breadcrumb
          className="mb-6"
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.articles"), href: "/articles" },
            { label: localized.title },
          ]}
        />

        <h1 className="text-4xl font-bold tracking-tight">{localized.title}</h1>
        {localized.excerpt ? <p className="mt-4 text-lg text-muted-foreground">{localized.excerpt}</p> : null}

        <div className="mt-5">
          <ArticleMeta
            article={
              {
                ...article,
                title_en: localized.title,
                description_en: localized.body,
                tags: article.tags ?? [],
                related_articles: [],
                related_projects: [],
                related_services: [],
              } as unknown as ArticleDetail
            }
            locale={previewLocale}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground" dir="auto">
          {t("articleEditor.wordCount", { count: stats.words })} · {t("articleEditor.readingTime", { count: stats.readingMinutes })}
        </p>

        {article.cover_image ? (
          <div className="mt-8 overflow-hidden rounded-3xl border">
            <img
              src={resolveMediaUrl(article.cover_image.file) ?? article.cover_image.file}
              alt={article.cover_image.alt_text_en || localized.title}
              className="aspect-[21/9] h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="article-body prose prose-slate mt-8 max-w-none dark:prose-invert" dir={previewLocale === "en" ? "ltr" : "rtl"}>
          {localized.body ? (
            <ArticleContent html={localized.body} />
          ) : (
            <p className="text-muted-foreground">{t("articlePreview.emptyBody")}</p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/articles">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t("articlePreview.backToList")}
            </Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
