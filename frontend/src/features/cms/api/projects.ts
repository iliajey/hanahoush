import type { ListParams, Paginated, Project } from "../types"

import { buildListParams, cmsGet, cmsList, type CmsRequestOptions } from "./client"

const RESOURCE = "/projects"

export interface ProjectListParams extends ListParams {
  category?: number
  category_slug?: string
  is_featured?: boolean
  client?: string
}

export async function fetchProjects(
  params: ProjectListParams,
  options: CmsRequestOptions,
): Promise<Paginated<Project>> {
  return cmsList<Project>(RESOURCE, {
    ...options,
    params: buildListParams({ ...params, page: params.page ?? 1 }),
  })
}

export async function fetchProject(id: number, options: CmsRequestOptions): Promise<Project> {
  return cmsGet<Project>(`${RESOURCE}/${id}/`, options)
}

export async function fetchFeaturedProjects(
  options: CmsRequestOptions,
  limit = 3,
): Promise<Project[]> {
  const result = await cmsList<Project>(RESOURCE, {
    ...options,
    params: { ...buildListParams({ pageSize: limit, ordering: "-end_date" }), is_featured: true },
  })
  return result.items
}
