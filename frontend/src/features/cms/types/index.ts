import type { PaginationMeta } from "@/shared/types/api"

import type { Locale } from "@/i18n"

// ---------------------------------------------------------------------------
// Common / shared shapes returned by the v1 API
// ---------------------------------------------------------------------------
export interface MediaRef {
  id: number
  file: string
  alt_text_fa?: string
  alt_text_en?: string
  alt_text_ar?: string
}

export interface TaxonomyRef {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
}

export interface Paginated<T> {
  items: T[]
  pagination?: PaginationMeta
}

export interface ListParams {
  page?: number
  pageSize?: number
  ordering?: string
  q?: string
}

export interface Publishable {
  id: number
  title_fa: string
  title_en: string
  title_ar?: string
  title?: string
  slug: string
  short_description_fa?: string
  short_description_en?: string
  short_description_ar?: string
  short_description?: string
  description_fa?: string
  description_en?: string
  description_ar?: string
  description?: string
  status: string
  status_display?: string
  is_published?: boolean
  is_featured: boolean
  is_public: boolean
  published_at?: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------
export interface ArticleTag {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
}

export interface Article extends Publishable {
  category: TaxonomyRef | null
  tags: ArticleTag[]
  author: string | null
  cover_image: MediaRef | null
  is_pinned?: boolean
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export interface Technology {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
  icon?: string
  website?: string
}

export interface Project extends Publishable {
  category: TaxonomyRef | null
  technologies: Technology[]
  client?: string
  location?: string
  cover_image: MediaRef | null
  start_date?: string | null
  end_date?: string | null
  live_url?: string
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
export interface ServiceSectionRef extends TaxonomyRef {
  description_fa?: string
  description_en?: string
  description_ar?: string
  icon?: string
}

export interface Service extends Publishable {
  section: ServiceSectionRef | null
  icon?: string
  cover_image: MediaRef | null
}

// ---------------------------------------------------------------------------
// Company content
// ---------------------------------------------------------------------------
export interface About {
  id: number
  title: string
  title_en: string
  description: string
  short_description?: string
  mission: string
  vision: string
  hero_image: MediaRef | null
  is_featured?: boolean
  status?: string
  published_at?: string | null
}

export interface TeamMember {
  id: number
  name: string
  position: string
  bio: string
  avatar: MediaRef | null
  email?: string
  linkedin_url?: string
  sort_order: number
}

export interface Partner {
  id: number
  name: string
  description: string
  logo: MediaRef | null
  website?: string
  sort_order: number
}

export interface Testimonial {
  id: number
  author_name: string
  author_role: string
  company: string
  content: string
  rating: number
  avatar: MediaRef | null
  is_featured: boolean
}

export interface FAQEntry {
  id: number
  question: string
  answer: string
  category?: string
  is_featured?: boolean
  sort_order?: number
}

export interface TimelineEntry {
  id: number
  title: string
  content: string
  date: string | null
  icon?: string
  sort_order?: number
}

export interface SocialLink {
  id: number
  platform: string
  label: string
  url: string
  icon?: string
  sort_order?: number
}

export interface Office {
  id: number
  name: string
  address: string
  city: string
  country: string
  phone?: string
  email?: string
  is_headquarters?: boolean
}

// ---------------------------------------------------------------------------
// Site surfaces
// ---------------------------------------------------------------------------
export interface SiteSettings {
  id: number
  site_name: string
  tagline: string
  tagline_en: string
  logo: MediaRef | null
  favicon: MediaRef | null
  contact_email: string
  contact_phone: string
  address: string
  default_locale: string
  supported_locales: string[]
  maintenance_mode: boolean
  meta_title: string
  meta_description: string
}

export interface NavItem {
  label: string
  href: string
}

export interface Navigation {
  items: NavItem[]
  cta: NavItem
  contact: NavItem
}

export interface FooterLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface Footer {
  columns: FooterColumn[]
  socials: SocialLink[]
  company: {
    name: string
    year: number
    tagline: string
    contact_email: string
    contact_phone: string
  }
}

export type { Locale }
