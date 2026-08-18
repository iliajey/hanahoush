import { useState } from "react"

import { useFeaturedProjects } from "@/features/cms"
import { ProjectCard, ProjectGrid } from "@/components/marketing/projects"
import { FeaturedProjectCard, ProjectFilterBar, ProjectsTimeline } from "@/features/projects/components"
import {
  useProjectCategories,
  useProjectTechnologies,
  useProjectsFiltered,
} from "@/features/projects/hooks"
import { projectAnalytics } from "@/features/projects/services/analytics"
import type { ProjectFilters } from "@/features/projects/types"

import { SectionHeading, type SectionProps } from "./common"

const EMPTY_FILTERS: ProjectFilters = { pageSize: 12 }

/** Editorial-style featured projects (asymmetric presentation). */
export function FeaturedProjectsSection({ config }: SectionProps) {
  const limit = Number(config.limit ?? 2)
  const projects = useFeaturedProjects(limit)
  const items = (projects.data ?? []).map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title || project.title_en,
    description: project.short_description || project.description || "",
    image: project.cover_image?.file,
    client: project.client,
    year: project.end_date ? new Date(project.end_date).getFullYear() : undefined,
    technologies: (project.technologies ?? []).map((t) => t.title_en || t.slug),
    category: project.category?.title_en || "",
    featured: Boolean(project.is_featured),
  }))

  return (
    <section className="py-24">
      <SectionHeading config={config} />
      {projects.isLoading ? <p className="mt-12 text-muted-foreground">Loading featured projects…</p> : null}
      {items.length ? (
        <div className="mt-12 space-y-16">
          {items.map((project, i) => (
            <FeaturedProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

/** Project discovery: API-filtered list with a result grid. */
export function ProjectFiltersSection({ config }: SectionProps) {
  const [filters, setFilters] = useState<ProjectFilters>({
    ...EMPTY_FILTERS,
    pageSize: Number(config.page_size ?? 12),
  })
  const query = useProjectsFiltered(filters)
  const categories = useProjectCategories()
  const technologies = useProjectTechnologies()

  const years = Array.from(
    new Set<number>(
      (query.data?.items ?? [])
        .map((p) => p.year ?? (p.end_date ? new Date(p.end_date).getFullYear() : undefined))
        .filter((year): year is number => year != null),
    ),
  ).sort((a, b) => b - a)

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <div className="mt-8">
        <ProjectFilterBar
          filters={filters}
          onChange={(next) => {
            setFilters(next)
            projectAnalytics.filter({})
          }}
          categories={categories.data ?? []}
          technologies={technologies.data ?? []}
          years={years}
          count={query.data?.count ?? 0}
        />
      </div>
      <div className="mt-8">
        {(query.data?.items ?? []).length > 0 ? (
          <ProjectGrid>
            {(query.data?.items ?? []).map((project) => (
              <a key={project.id} href={`/projects/${project.slug}`} className="contents">
                <ProjectCard
                  title={project.title || project.title_en}
                  description={project.short_description || project.description || ""}
                  image={project.cover_image?.file}
                  tags={(project.technologies ?? []).slice(0, 4).map((t) => t.title_en || t.slug)}
                  client={project.client}
                  featured={Boolean(project.is_featured)}
                />
              </a>
            ))}
          </ProjectGrid>
        ) : null}
      </div>
      {query.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading projects…</p> : null}
      {query.isError ? <p className="mt-6 text-sm text-destructive">Failed to load projects.</p> : null}
      {query.data && query.data.items.length === 0 && !query.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">No projects match the current filters.</p>
      ) : null}
    </section>
  )
}

/** Technology explorer — discover projects by real project technologies. */
export function TechnologyExplorerSection({ config }: SectionProps) {
  const technologies = useProjectTechnologies()
  const [selected, setSelected] = useState<string | undefined>()
  const projects = useProjectsFiltered(selected ? { technologySlug: selected, pageSize: 8 } : { pageSize: 8 })

  return (
    <section className="border-t py-20">
      <SectionHeading config={config} />
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Technology explorer">
        {technologies.data?.map((tech) => {
          const active = tech.slug === selected
          return (
            <button
              key={tech.slug}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelected(active ? undefined : tech.slug)
                if (!active) projectAnalytics.technologyFilter(tech.slug)
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-brand-500 bg-brand-500/15 text-brand-700 dark:text-brand-300" : "bg-card hover:border-brand-500/40"
              }`}
            >
              {tech.title_en} <span className="text-xs text-muted-foreground">({tech.projects_count ?? 0})</span>
            </button>
          )
        })}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(projects.data?.items ?? []).map((project) => (
          <a key={project.id} href={`/projects/${project.slug}`} className="contents">
            <ProjectCard
              title={project.title || project.title_en}
              description={project.short_description || project.description || ""}
              image={project.cover_image?.file}
              tags={(project.technologies ?? []).slice(0, 3).map((t) => t.title_en || t.slug)}
              client={project.client}
            />
          </a>
        ))}
      </div>
    </section>
  )
}

/** Portfolio evolution timeline using real project years. */
export function ProjectsTimelineSection({ config }: SectionProps) {
  const projects = useProjectsFiltered({ pageSize: 100 })
  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <div className="mt-10 max-w-3xl">
        <ProjectsTimeline projects={projects.data?.items ?? []} />
      </div>
    </section>
  )
}
