import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { PageRenderer } from "@/features/page-builder"

import { useProjectBySlug } from "../hooks"
import { useProjectSeo } from "../services/seo"
import { buildCaseStudyPage } from "./case-study.sections"

/**
 * /projects/:slug — the Case Study, assembled as a page and rendered by the
 * existing PageRenderer (each section lazy-loaded from the registry).
 */
export function ProjectCaseStudyPage() {
  const { t } = useTranslation()
  const { slug = "" } = useParams<{ slug: string }>()
  const query = useProjectBySlug(slug)
  const project = query.data

  useProjectSeo({ project, slug })

  if (query.isLoading) return <ProjectPageSkeleton />
  if (query.isError || !project) {
    return (
      <main className="p-8">
        <ErrorState
          title={t("projects.notFoundTitle")}
          description={t("projects.notFoundDescription")}
          onRetry={() => query.refetch()}
        />
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/projects">{t("nav.projects")}</Link>
          </Button>
          <Button asChild>
            <Link to="/">{t("nav.home")}</Link>
          </Button>
        </div>
      </main>
    )
  }

  const page = buildCaseStudyPage(project.slug, {
    title: project.title || project.title_en,
    description: project.short_description || project.description || "",
    canonical: typeof window !== "undefined" ? `${window.location.origin}/projects/${project.slug}` : undefined,
    ogImage: project.cover_image?.file,
  })

  return (
    <main className="flex-1">
      <PageRenderer page={page} />
    </main>
  )
}

export function ProjectPageSkeleton() {
  return (
    <main className="space-y-8 p-8">
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded-full bg-muted" />
        <div className="h-14 w-2/3 rounded-2xl bg-muted" />
        <div className="h-4 w-1/2 rounded-full bg-muted" />
      </div>
    </main>
  )
}