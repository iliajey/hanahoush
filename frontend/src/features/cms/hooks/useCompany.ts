import { useLanguage } from "@/app/language/useLanguage"

import { fetchAbout, fetchFAQs, fetchOffices, fetchSocialLinks, fetchTeamMembers, fetchTimeline } from "../api/company"
import type { FAQListParams } from "../api/company"
import { cmsKeys } from "../queries/keys"
import type { About, FAQEntry, Office, Paginated, SocialLink, TeamMember, TimelineEntry } from "../types"

import { useCmsQuery } from "./useCmsQuery"

/** The site's about page (singleton) or `null` when unpublished. */
export function useAbout() {
  const locale = useLanguage().language
  return useCmsQuery<About | null>(
    cmsKeys.company.about(locale),
    () => fetchAbout({ locale }),
    { tier: "content", description: "GET /api/v1/about/" },
  )
}

/** Published team members. */
export function useTeam() {
  const locale = useLanguage().language
  return useCmsQuery<TeamMember[]>(
    cmsKeys.company.team(locale),
    () => fetchTeamMembers({ locale }),
    { tier: "content", description: "GET /api/v1/team/" },
  )
}

/** Company milestones / timeline. */
export function useTimeline() {
  const locale = useLanguage().language
  return useCmsQuery<TimelineEntry[]>(
    cmsKeys.company.timeline(locale),
    () => fetchTimeline({ locale }),
    { tier: "content", description: "GET /api/v1/timeline/" },
  )
}

/** FAQ entries with optional category / featured filtering + search. */
export function useFAQs(params: FAQListParams = {}) {
  const locale = useLanguage().language
  return useCmsQuery<Paginated<FAQEntry>>(
    cmsKeys.company.faqs(locale, params),
    () => fetchFAQs(params, { locale }),
    { tier: "listings", description: "GET /api/v1/faqs/" },
  )
}

/** Social links (footer / contact). */
export function useSocialLinks() {
  const locale = useLanguage().language
  return useCmsQuery<SocialLink[]>(
    cmsKeys.company.socialLinks(locale),
    () => fetchSocialLinks({ locale }),
    { tier: "content", description: "GET /api/v1/social-links/" },
  )
}

/** Physical offices (contact). */
export function useOffices() {
  const locale = useLanguage().language
  return useCmsQuery<Office[]>(
    cmsKeys.company.offices(locale),
    () => fetchOffices({ locale }),
    { tier: "content", description: "GET /api/v1/offices/" },
  )
}