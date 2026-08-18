import type { FAQEntry, Locale, Partner, TeamMember, Testimonial, TimelineEntry } from "../types"

/** View model consumed by marketing components. */
export interface TestimonialView {
  quote: string
  name: string
  role: string
  company: string
  avatar?: string
  rating: number
}

export interface TimelineView {
  date: string
  title: string
  description?: string
}

export interface FAQView {
  question: string
  answer: string
}

export interface PartnerView {
  name: string
  src: string
}

export interface TeamMemberView {
  name: string
  position: string
  bio: string
  avatar?: string
}

export function mapTestimonial(item: Testimonial): TestimonialView {
  return {
    quote: item.content,
    name: item.author_name,
    role: item.author_role,
    company: item.company,
    avatar: item.avatar?.file,
    rating: item.rating || 5,
  }
}

export function mapTestimonials(items: Testimonial[]): TestimonialView[] {
  return items.map(mapTestimonial)
}

export function mapTimeline(item: TimelineEntry, locale: Locale): TimelineView {
  const date = item.date
    ? formatYear(item.date, locale)
    : String(item.sort_order ?? item.id ?? "")
  return { date, title: item.title, description: item.content }
}

export function mapTimelineEntries(items: TimelineEntry[], locale: Locale): TimelineView[] {
  return items.map((item) => mapTimeline(item, locale))
}

export function mapFAQ(item: FAQEntry): FAQView {
  return { question: item.question, answer: item.answer }
}

export function mapFAQs(items: FAQEntry[]): FAQView[] {
  return items.map(mapFAQ)
}

export function mapPartner(item: Partner): PartnerView {
  return { name: item.name, src: item.logo?.file ?? "" }
}

export function mapPartners(items: Partner[]): PartnerView[] {
  return items.map(mapPartner)
}

export function mapTeamMember(item: TeamMember): TeamMemberView {
  return {
    name: item.name,
    position: item.position,
    bio: item.bio,
    avatar: item.avatar?.file,
  }
}

export function formatYear(value: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, { year: "numeric" }).format(
      new Date(value),
    )
  } catch {
    return value.slice(0, 4)
  }
}