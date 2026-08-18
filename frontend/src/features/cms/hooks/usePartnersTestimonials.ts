import { useLanguage } from "@/app/language/useLanguage"

import { fetchTestimonials, type TestimonialListParams } from "../api/company"
import { fetchPartners } from "../api/company"
import { cmsKeys } from "../queries/keys"
import type { Paginated, Partner, Testimonial } from "../types"

import { useCmsQuery } from "./useCmsQuery"

/** Paginated testimonials (optional `is_featured` filter). */
export function useTestimonials(params: TestimonialListParams = {}) {
  const locale = useLanguage().language
  return useCmsQuery<Paginated<Testimonial>>(
    cmsKeys.company.testimonials(locale, params),
    () => fetchTestimonials(params, { locale }),
    { tier: "listings", description: "GET /api/v1/testimonials/" },
  )
}

/** All published partners. */
export function usePartners() {
  const locale = useLanguage().language
  return useCmsQuery<Partner[]>(
    cmsKeys.company.partners(locale),
    () => fetchPartners({ locale }),
    { tier: "content", description: "GET /api/v1/partners/" },
  )
}