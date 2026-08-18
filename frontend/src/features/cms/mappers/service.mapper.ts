import type { Locale, Service } from "../types"

/** View model consumed by marketing ServiceCard components. */
export interface ServiceView {
  id: number
  title: string
  description: string
  features?: string[]
  href: string
  iconKey?: string
}

export function mapService(service: Service, _locale: Locale): ServiceView {
  return {
    id: service.id,
    title: service.title || service.title_en,
    description: service.description || service.description_en || service.short_description_en || "",
    href: "/services",
    iconKey: service.icon,
  }
}

export function mapServices(items: Service[], locale: Locale): ServiceView[] {
  return items.map((item) => mapService(item, locale))
}