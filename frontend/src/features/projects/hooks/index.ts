import { useLanguage } from "@/app/language/useLanguage"
import { useCmsQuery } from "@/features/cms/hooks/useCmsQuery"

import { fetchProjectBySlug, fetchProjectCategories, fetchProjectsFiltered, fetchProjectTechnologies } from "../api"
import { projectsKeys } from "../queries"
import type { ProjectCaseStudy, ProjectCategoryRefSummary, ProjectFilters, ProjectSummary, ProjectTechnologyRef } from "../types"

function useLocale() {
  return useLanguage().language
}

/** Full case-study detail by slug. */
export function useProjectBySlug(slug: string | undefined) {
  const locale = useLocale()
  return useCmsQuery<ProjectCaseStudy>(
    projectsKeys.detail(locale, slug ?? ""),
    () => fetchProjectBySlug(slug as string, { locale }),
    { tier: "content", description: `GET /api/v1/projects/by-slug/${slug}/` },
    { enabled: Boolean(slug) },
  )
}

/** Technology explorer data. */
export function useProjectTechnologies() {
  const locale = useLocale()
  return useCmsQuery<ProjectTechnologyRef[]>(
    projectsKeys.technologies(locale),
    () => fetchProjectTechnologies({ locale }),
    { tier: "content", description: "GET /api/v1/projects/technologies/" },
  )
}

/** Categories used by published projects (filter picker + explorer). */
export function useProjectCategories() {
  const locale = useLocale()
  return useCmsQuery<ProjectCategoryRefSummary[]>(
    [...projectsKeys.all, "categories", locale],
    () => fetchProjectCategories({ locale }),
    { tier: "content", description: "GET /api/v1/projects/categories/" },
  )
}

/** Filtered/paginated project listing (API-side filtering). */
export function useProjectsFiltered(filters: ProjectFilters) {
  const locale = useLocale()
  return useCmsQuery<{ items: ProjectSummary[]; count: number }>(
    projectsKeys.list(locale, filters),
    () => fetchProjectsFiltered(filters, { locale }),
    { tier: "listings", description: "GET /api/v1/projects/?category=&technologies=&year=&q=&is_featured=" },
  )
}