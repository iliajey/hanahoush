import { useEffect } from "react"
import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { CalendarDays } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { GradientCTA } from "@/components/marketing/cta"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"
import { ArchitectureViewer, CaseStudySection, ProjectGallery, ProjectResults } from "@/features/projects/components"
import type { ArchitectureGraph } from "@/features/projects/components/ArchitectureViewer"
import { useProjectBySlug } from "@/features/projects/hooks"
import { projectAnalytics } from "@/features/projects/services/analytics"
import { mapGallery } from "@/features/projects/mappers"
import type { SectionConfig } from "../../types"

import { sectionIcon, type SectionProps } from "./common"

function useCaseProject(config: SectionConfig) {
  const slug = String(config.projectSlug ?? config.project_slug ?? "")
  const query = useProjectBySlug(slug)
  return { slug, project: query.data, query }
}

function ContentShell({ children }: { children: ReactNode }) {
  return <div className="container-hanahoush py-16">{children}</div>
}

/** 1 · Case Study Hero. */
export function CaseHeroSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project, query } = useCaseProject(config)
  useEffect(() => {
    if (project) projectAnalytics.view(project.slug)
  }, [project])
  return (
    <section className="relative overflow-hidden pt-20 pb-14">
      <div className="container-hanahoush relative z-10 grid items-center gap-8 lg:grid-cols-2">
        {query.isLoading ? (
          <p className="text-muted-foreground">{t("caseStudy.loading")}</p>
        ) : query.isError || !project ? (
          <p className="text-destructive">{t("caseStudy.unavailable")}</p>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Breadcrumb
                className="mb-6"
                items={[
                  { label: t("nav.home"), href: "/" },
                  { label: t("nav.projects"), href: "/projects" },
                  { label: project.title || project.title_en || t("nav.projects") },
                ]}
              />
              <div className="flex flex-wrap items-center gap-2">
                {project.is_featured ? <Badge>{t("caseStudy.featured")}</Badge> : null}
                {project.category ? <Badge variant="secondary">{project.category.title_en}</Badge> : null}
                {project.year ? (
                  <Badge variant="outline" className="gap-1">
                    <CalendarDays className="h-3 w-3" /> {project.year}
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{project.title || project.title_en}</h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">{project.short_description || project.description || ""}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {(project.technologies ?? []).slice(0, 8).map((tech) => {
                  const Icon = sectionIcon(tech.icon, tech.id)
                  return (
                    <Badge key={tech.id} variant="outline" className="gap-1 text-xs">
                      <Icon className="h-3 w-3" /> {tech.title_en}
                    </Badge>
                  )
                })}
              </div>
              {project.client ? <p className="mt-5 text-sm text-muted-foreground">{t("caseStudy.clientPrefix")} · {project.client}</p> : null}
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <div className="overflow-hidden rounded-3xl border">
                <ResponsiveImage src={project.cover_image?.file} alt={project.title || project.title_en} className="aspect-[16/10] h-full w-full" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}

export function CaseChallengeSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  return (
    <section className="py-14">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.challengeLabel")} title={t("caseStudy.challengeTitle")} body={project?.case_study?.challenge} />
      </ContentShell>
    </section>
  )
}

export function CaseObjectivesSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  return (
    <section className="py-14 bg-muted/30">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.objectivesLabel")} title={t("caseStudy.objectivesTitle")} body={project?.case_study?.objectives} />
      </ContentShell>
    </section>
  )
}

export function CaseSolutionSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  return (
    <section className="py-14">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.solutionLabel")} title={t("caseStudy.solutionTitle")} body={project?.case_study?.solution_approach} />
      </ContentShell>
    </section>
  )
}

export function CaseArchitectureSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  const architecture = (project?.case_study?.architecture ?? undefined) as ArchitectureGraph | undefined
  return (
    <section className="py-14 bg-muted/30">
      <ContentShell>
        <div className="space-y-6">
          <CaseStudySection label={t("caseStudy.architectureLabel")} title={t("caseStudy.architectureTitle")} />
          <ArchitectureViewer architecture={architecture} />
        </div>
      </ContentShell>
    </section>
  )
}

export function CaseTechnologySection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  return (
    <section className="py-14">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.technologyLabel")} title={t("caseStudy.technologyTitle")}>
          <div className="mt-4 flex flex-wrap gap-2">
            {(project?.technologies ?? []).map((tech) => {
              const Icon = sectionIcon(tech.icon, tech.id)
              return (
                <span key={tech.id} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
                  <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" /> {tech.title_en}
                </span>
              )
            })}
          </div>
        </CaseStudySection>
      </ContentShell>
    </section>
  )
}

export function CaseJourneySection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  const stages = project?.case_study?.implementation_stages ?? []
  return (
    <section className="py-14 bg-muted/30">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.journeyLabel")} title={t("caseStudy.journeyTitle")}>
          {stages.length ? (
            <ol className="mt-6 space-y-4 border-s border-border ps-6">
              {stages.map((stage, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-brand-500 bg-card rtl:-right-[27px] rtl:left-auto" aria-hidden="true" />
                  <div className="text-sm font-semibold">{stage.stage || t("caseStudy.stage", { count: i + 1 })}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{stage.detail}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t("caseStudy.journeyEmpty")}</p>
          )}
        </CaseStudySection>
      </ContentShell>
    </section>
  )
}

export function CaseGallerySection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  return (
    <section className="py-14">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.galleryLabel")} title={t("caseStudy.galleryTitle")}>
          <div className="mt-6">
            <ProjectGallery images={mapGallery(project?.images ?? [])} />
          </div>
        </CaseStudySection>
      </ContentShell>
    </section>
  )
}

export function CaseResultsSection({ config }: SectionProps) {
  const { project } = useCaseProject(config)
  return (
    <section className="py-14 bg-muted/30">
      <ContentShell>
        <ProjectResults results={project?.case_study?.results} />
      </ContentShell>
    </section>
  )
}

export function CaseRelatedProjectsSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  const related = project?.related_projects ?? []
  return (
    <section className="py-14">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.relatedWorkLabel")} title={t("caseStudy.relatedWorkTitle")}>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <a
                key={item.id}
                href={`/projects/${item.slug}`}
                onClick={() => projectAnalytics.relatedProjectClick(item.slug)}
                className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-500/40"
              >
                <h4 className="font-semibold group-hover:text-primary">{item.title || item.title_en}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.short_description || item.description || ""}</p>
              </a>
            ))}
          </div>
        </CaseStudySection>
      </ContentShell>
    </section>
  )
}

export function CaseRelatedArticlesSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { project } = useCaseProject(config)
  const articles = project?.related_articles ?? []
  return (
    <section className="py-14 bg-muted/30">
      <ContentShell>
        <CaseStudySection label={t("caseStudy.readMoreLabel")} title={t("caseStudy.readMoreTitle")}>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <a
                key={article.id}
                href={`/articles/${article.slug}`}
                onClick={() => projectAnalytics.relatedArticleClick(article.slug)}
                className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-500/40"
              >
                <h4 className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">{article.title || ""}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{article.description}</p>
              </a>
            ))}
          </div>
        </CaseStudySection>
      </ContentShell>
    </section>
  )
}

export function CaseCTASection({ config: _config }: SectionProps) {
  const { t } = useTranslation()
  return (
    <section className="py-16">
      <GradientCTA
        title={t("caseStudy.ctaTitle")}
        description={t("caseStudy.ctaDescription")}
        primary={{ label: t("about.cta.primary"), href: "/contact" }}
        secondary={{ label: t("about.cta.secondary"), href: "/services" }}
        onPrimaryClick={() => projectAnalytics.cta("case-primary")}
        onSecondaryClick={() => projectAnalytics.cta("case-secondary")}
      />
    </section>
  )
}