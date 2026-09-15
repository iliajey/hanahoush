import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Pencil, User } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { resolveMediaUrl } from "@/shared/lib"
import { ArticleContent } from "../../articles/components/ArticleContent"
import { editorStatsFor } from "../../articles/workspace/RichTextEditor"
import { useProjectGallery, useStaffProject } from "../hooks/staff"
import { ArchitectureViewer } from "../components/ArchitectureViewer"
import { CaseStudySection } from "../components/CaseStudySection"
import { localizedLeaf, type StudioLocale } from "./caseStudy"
import type { CaseStudyRaw } from "../api/staff"

/** Staff-only draft preview (Phase 15): renders the saved project through
 * the same visual language as the public case study — hero, narrative
 * body, structured case-study sections (challenge / objectives / solution
 * / stages / architecture / results), then gallery. Read-only — nothing
 * here can publish. */
export function ProjectPreviewPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = id ? Number(id) : undefined
  const [previewLocale, setPreviewLocale] = useState<StudioLocale>(
    language === "fa" || language === "ar" ? language : "en",
  )

  const { data: project, isLoading, isError, refetch } = useStaffProject(projectId)
  const galleryQuery = useProjectGallery(projectId)

  const localized = useMemo(() => {
    if (!project) return null
    const detail = project as typeof project & {
      description_fa?: string
      description_en?: string
      description_ar?: string
      short_description_fa?: string
      short_description_en?: string
      short_description_ar?: string
      case_study_raw?: CaseStudyRaw | null
    }
    const pick = (base: "title" | "description" | "short_description") =>
      (detail[`${base}_${previewLocale}` as keyof typeof detail] as string | undefined) ||
      (detail[`${base}_en` as keyof typeof detail] as string | undefined) ||
      ""
    return {
      title: pick("title") || project.slug,
      body: pick("description"),
      excerpt: pick("short_description"),
      caseStudy: (detail.case_study_raw ?? null) as CaseStudyRaw | null,
    }
  }, [project, previewLocale])

  const stats = useMemo(() => editorStatsFor(localized?.body ?? ""), [localized])
  const gallery = useMemo(
    () => (galleryQuery.data ?? []).map((row) => ({
      src: resolveMediaUrl(row.image_url) ?? row.image_url,
      alt: row.alt_text_en || row.alt_text_fa || row.alt_text_ar || "Project image",
    })),
    [galleryQuery.data],
  )

  const cs = localized?.caseStudy
  const challenge = cs ? localizedLeaf(cs.challenge, previewLocale) : ""
  const objectives = cs ? localizedLeaf(cs.objectives, previewLocale) : ""
  const solution = cs ? localizedLeaf(cs.solution_approach, previewLocale) : ""
  const results = cs ? localizedLeaf(cs.results, previewLocale) : ""
  const archDescription = cs?.architecture ? localizedLeaf(cs.architecture.description, previewLocale) : ""
  const stages = useMemo(
    () =>
      (cs?.implementation_stages ?? []).map((entry) => ({
        stage: localizedLeaf(entry.stage, previewLocale),
        detail: localizedLeaf(entry.detail, previewLocale),
      })),
    [cs, previewLocale],
  )
  const archNodes = useMemo(() => {
    const nodes = cs?.architecture?.nodes ?? []
    return nodes.map((node) => {
      const labels = Array.isArray(node.labels)
        ? node.labels.map((label) => (typeof label === "string" ? label : localizedLeaf(label, previewLocale)))
        : (node.labels?.[previewLocale] ?? node.labels?.en ?? [])
      return { layer: node.layer, labels }
    })
  }, [cs, previewLocale])

  if (!Number.isFinite(projectId)) {
    return (
      <PageWrapper title={t("projectPreview.title")}>
        <ErrorState title={t("projectPreview.notFound")} description={t("projectPreview.notFoundDescription")} />
      </PageWrapper>
    )
  }

  if (isLoading) {
    return (
      <PageWrapper title={t("projectPreview.title")}>
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !project || !localized) {
    return (
      <PageWrapper title={t("projectPreview.title")}>
        <ErrorState
          title={t("projectPreview.errorTitle")}
          description={t("projectPreview.errorDescription")}
          onRetry={() => void refetch()}
        />
      </PageWrapper>
    )
  }

  const cover = resolveMediaUrl(project.cover_image?.file)

  return (
    <PageWrapper
      title={t("projectPreview.title")}
      description={t("projectPreview.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("projectWorkspace.title"), href: "/dashboard/projects" },
        { label: project.slug },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border" role="group" aria-label={t("projectPreview.localeLabel")}>
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
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t("projectWorkspace.edit")}
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("projectPreview.draftBadge")}</Badge>
          <Badge variant="secondary">{project.status_display}</Badge>
          {project.is_featured ? <Badge>{t("projectPreview.featured")}</Badge> : null}
        </div>

        <Breadcrumb
          className="mb-6"
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.projects"), href: "/projects" },
            { label: localized.title },
          ]}
        />

        <h1 className="text-4xl font-bold tracking-tight">{localized.title}</h1>
        {localized.excerpt ? <p className="mt-4 text-lg text-muted-foreground">{localized.excerpt}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {project.client ? (
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden="true" />
              {t("projectPreview.client")}: <span dir="auto" className="font-medium text-foreground">{project.client}</span>
            </span>
          ) : null}
          {project.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span dir="auto">{project.location}</span>
            </span>
          ) : null}
          {project.year ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {project.year}
            </span>
          ) : null}
          {project.live_url ? (
            <a href={project.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline" dir="ltr">
              {t("projectPreview.liveUrl")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        {(project.technologies ?? []).length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(project.technologies ?? []).map((tech) => (
              <Badge key={tech.id} variant="outline">{tech.title_en}</Badge>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground" dir="auto">
          {t("projectWorkspace.wordCount", { count: stats.words })} · {stats.readingMinutes} min
        </p>

        {cover ? (
          <div className="mt-8 overflow-hidden rounded-3xl border">
            <img src={cover} alt={project.cover_image?.alt_text_en || localized.title} className="aspect-[16/10] h-full w-full object-cover" loading="lazy" />
          </div>
        ) : null}

        <div className="article-body prose prose-slate mt-8 max-w-none dark:prose-invert" dir={previewLocale === "en" ? "ltr" : "rtl"}>
          {localized.body ? (
            <ArticleContent html={localized.body} />
          ) : (
            <p className="text-muted-foreground">{t("projectPreview.emptyBody")}</p>
          )}
        </div>

        {challenge ? (
          <div className="mt-10">
            <CaseStudySection label={t("caseStudy.challengeLabel")} title={t("caseStudy.challengeTitle")} body={challenge} />
          </div>
        ) : null}

        {objectives ? (
          <div className="mt-10">
            <CaseStudySection label={t("caseStudy.objectivesLabel")} title={t("caseStudy.objectivesTitle")} body={objectives} />
          </div>
        ) : null}

        {solution ? (
          <div className="mt-10">
            <CaseStudySection label={t("caseStudy.solutionLabel")} title={t("caseStudy.solutionTitle")} body={solution} />
          </div>
        ) : null}

        {stages.length > 0 ? (
          <div className="mt-10">
            <CaseStudySection label={t("caseStudy.journeyLabel")} title={t("caseStudy.journeyTitle")}>
              <ol className="mt-6 space-y-4 border-s border-border ps-6">
                {stages.map((entry, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-brand-500 bg-card rtl:-right-[27px] rtl:left-auto" aria-hidden="true" />
                    <div className="text-sm font-semibold">{entry.stage || t("caseStudy.stage", { count: i + 1 })}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p>
                  </li>
                ))}
              </ol>
            </CaseStudySection>
          </div>
        ) : null}

        {archNodes.length > 0 || archDescription ? (
          <div className="mt-10">
            <CaseStudySection label={t("caseStudy.architectureLabel")} title={t("caseStudy.architectureTitle")}>
              <ArchitectureViewer
                architecture={{ description: archDescription || undefined, nodes: archNodes }}
                locale={previewLocale}
              />
            </CaseStudySection>
          </div>
        ) : null}

        {results ? (
          <div className="mt-10">
            <CaseStudySection label={t("projectResults.heading")} title={t("projectResults.heading")} body={results} />
          </div>
        ) : null}

        {gallery.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold">{t("projectPreview.gallery")}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((image, i) => (
                <div key={image.src + i} className="overflow-hidden rounded-xl border bg-muted/30">
                  <img src={image.src} alt={image.alt} className="aspect-square h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/projects">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t("projectPreview.backToList")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/projects/${project.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("projectWorkspace.edit")}
            </Link>
          </Button>
          {project.status === "published" ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/projects/${project.slug}`} target="_blank" rel="noreferrer">
                {t("projectWorkspace.openCaseStudy")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageWrapper>
  )
}
