import { cmsGet, cmsList, type CmsRequestOptions } from "@/features/cms/api/client"

import type {
  ProjectCategoryRefSummary,
  ProjectFilters as ProjectListFilters,
  ProjectCaseStudy,
  ProjectSummary,
  ProjectTechnologyRef,
} from "../types"

/** Full case-study detail by slug (draft-protected, localized). */
export function fetchProjectBySlug(slug: string, options: CmsRequestOptions): Promise<ProjectCaseStudy> {
  return cmsGet<ProjectCaseStudy>(`/projects/by-slug/${slug}/`, options)
}

/** Technology explorer: every technology used by published projects. */
export async function fetchProjectTechnologies(options: CmsRequestOptions): Promise<ProjectTechnologyRef[]> {
  return cmsGet<ProjectTechnologyRef[]>(`/projects/technologies/`, options)
}

/** Category explorer: categories used by published projects. */
export async function fetchProjectCategories(options: CmsRequestOptions): Promise<ProjectCategoryRefSummary[]> {
  return cmsGet<ProjectCategoryRefSummary[]>(`/projects/categories/`, options)
}

export interface ProjectListEndpointParams extends Record<string, unknown> {
  page?: number
  page_size?: number
  category?: number
  category_slug?: string
  technologies?: string
  year?: number
  is_featured?: boolean
  q?: string
  ordering?: string
}

/** Map the domain filter object onto the API query params. */
export function buildProjectParams(filters: ProjectListFilters): ProjectListEndpointParams {
  const params: ProjectListEndpointParams = {}
  if (filters.page != null) params.page = filters.page
  if (filters.pageSize != null) params.page_size = filters.pageSize
  if (filters.categoryId != null) params.category = filters.categoryId
  if (filters.technologySlug) params.technologies = filters.technologySlug
  if (filters.year != null) params.year = filters.year
  if (filters.featuredOnly) params.is_featured = true
  if (filters.q) params.q = filters.q
  return params
}

/** Paginated project listing from the existing API. */
export async function fetchProjectsFiltered(
  filters: ProjectListFilters,
  options: CmsRequestOptions,
): Promise<{ items: ProjectSummary[]; count: number }> {
  const result = await cmsList<ProjectSummary>("/projects", {
    ...options,
    params: buildProjectParams(filters),
  })
  return { items: result.items, count: result.pagination?.count ?? result.items.length }
}