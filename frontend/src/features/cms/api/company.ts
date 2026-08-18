import type {
  About,
  FAQEntry,
  ListParams,
  Office,
  Paginated,
  Partner,
  SocialLink,
  TeamMember,
  Testimonial,
  TimelineEntry,
} from "../types"

import { buildListParams, cmsList, type CmsRequestOptions } from "./client"

export async function fetchAbout(options: CmsRequestOptions): Promise<About | null> {
  const result = await cmsList<About>("/about", { ...options, params: { ...buildListParams({ pageSize: 1 }) } })
  return result.items[0] ?? null
}

export async function fetchTeamMembers(options: CmsRequestOptions): Promise<TeamMember[]> {
  const result = await cmsList<TeamMember>("/team", { ...options, params: buildListParams({ pageSize: 100 }) })
  return result.items
}

export async function fetchPartners(options: CmsRequestOptions): Promise<Partner[]> {
  const result = await cmsList<Partner>("/partners", { ...options, params: buildListParams({ pageSize: 100 }) })
  return result.items
}

export interface TestimonialListParams extends ListParams {
  is_featured?: boolean
}

export async function fetchTestimonials(
  params: TestimonialListParams,
  options: CmsRequestOptions,
): Promise<Paginated<Testimonial>> {
  return cmsList<Testimonial>("/testimonials", {
    ...options,
    params: buildListParams({ ...params, page: params.page ?? 1 }),
  })
}

export interface FAQListParams extends ListParams {
  category?: string
  is_featured?: boolean
}

export async function fetchFAQs(
  params: FAQListParams,
  options: CmsRequestOptions,
): Promise<Paginated<FAQEntry>> {
  return cmsList<FAQEntry>("/faqs", {
    ...options,
    params: buildListParams({ ...params, page: params.page ?? 1 }),
  })
}

export async function fetchTimeline(options: CmsRequestOptions): Promise<TimelineEntry[]> {
  const result = await cmsList<TimelineEntry>("/timeline", { ...options, params: buildListParams({ pageSize: 100 }) })
  return result.items
}

export async function fetchSocialLinks(options: CmsRequestOptions): Promise<SocialLink[]> {
  const result = await cmsList<SocialLink>("/social-links", { ...options, params: buildListParams({ pageSize: 100 }) })
  return result.items
}

export async function fetchOffices(options: CmsRequestOptions): Promise<Office[]> {
  const result = await cmsList<Office>("/offices", { ...options, params: buildListParams({ pageSize: 100 }) })
  return result.items
}
