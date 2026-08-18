import { useLanguage } from "@/app/language/useLanguage"

import { fetchService, fetchServices, fetchServiceSections, type ServiceListParams } from "../api/services"
import { cmsKeys } from "../queries/keys"
import type { Paginated, Service, ServiceSectionRef } from "../types"

import { useCmsQuery } from "./useCmsQuery"

/** Paginated published services (optional section / featured filters). */
export function useServices(params: ServiceListParams = {}) {
  const locale = useLanguage().language
  return useCmsQuery<Paginated<Service>>(
    cmsKeys.services.list(locale, params),
    () => fetchServices(params, { locale }),
    { tier: "content", description: "GET /api/v1/services/" },
  )
}

/** Service section groupings. */
export function useServiceSections() {
  const locale = useLanguage().language
  return useCmsQuery<ServiceSectionRef[]>(
    cmsKeys.services.sections(locale),
    () => fetchServiceSections({ locale }),
    { tier: "content", description: "GET /api/v1/service-sections/" },
  )
}

/** Single service detail. */
export function useService(id: number | undefined) {
  const locale = useLanguage().language
  return useCmsQuery<Service>(
    cmsKeys.services.detail(locale, id ?? 0),
    () => fetchService(id as number, { locale }),
    { tier: "content", description: `GET /api/v1/services/${id}/` },
    { enabled: id != null },
  )
}