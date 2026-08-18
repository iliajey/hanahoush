import type { ListParams, Paginated, Service, ServiceSectionRef } from "../types"

import { buildListParams, cmsGet, cmsList, type CmsRequestOptions } from "./client"

const RESOURCE = "/services"

export interface ServiceListParams extends ListParams {
  section?: number
  section_slug?: string
  is_featured?: boolean
}

export async function fetchServices(
  params: ServiceListParams,
  options: CmsRequestOptions,
): Promise<Paginated<Service>> {
  return cmsList<Service>(RESOURCE, {
    ...options,
    params: buildListParams({ ...params, page: params.page ?? 1 }),
  })
}

export async function fetchService(id: number, options: CmsRequestOptions): Promise<Service> {
  return cmsGet<Service>(`${RESOURCE}/${id}/`, options)
}

export async function fetchServiceSections(
  options: CmsRequestOptions,
): Promise<ServiceSectionRef[]> {
  return cmsGet<ServiceSectionRef[]>("/service-sections", options)
}
