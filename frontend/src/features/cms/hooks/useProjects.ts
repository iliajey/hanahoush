import { useLanguage } from "@/app/language/useLanguage"

import { fetchProject, fetchProjects, fetchFeaturedProjects, type ProjectListParams } from "../api/projects"
import { cmsKeys } from "../queries/keys"
import type { Paginated, Project } from "../types"

import { useCmsQuery } from "./useCmsQuery"

/** Paginated published projects with pagination/filtering/search support. */
export function useProjects(params: ProjectListParams = {}) {
  const locale = useLanguage().language
  return useCmsQuery<Paginated<Project>>(
    cmsKeys.projects.list(locale, params),
    () => fetchProjects(params, { locale }),
    { tier: "listings", description: "GET /api/v1/projects/" },
  )
}

/** Featured published projects (homepage portfolio). */
export function useFeaturedProjects(limit = 3) {
  const locale = useLanguage().language
  return useCmsQuery<Project[]>(
    cmsKeys.projects.list(locale, { featured: true, limit }),
    () => fetchFeaturedProjects({ locale }, limit),
    { tier: "listings", description: "GET /api/v1/projects/?is_featured=true" },
  )
}

/** Single project detail. */
export function useProject(id: number | undefined) {
  const locale = useLanguage().language
  return useCmsQuery<Project>(
    cmsKeys.projects.detail(locale, id ?? 0),
    () => fetchProject(id as number, { locale }),
    { tier: "content", description: `GET /api/v1/projects/${id}/` },
    { enabled: id != null },
  )
}