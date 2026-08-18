/** Page-builder domain types (mirror the backend Page composition API). */

export type SectionConfig = Record<string, unknown>

export interface PageSection {
  id: number
  type: string
  title: string | null
  is_enabled: boolean
  order: number
  config: SectionConfig
}

export interface PageSEO {
  meta_title?: string | null
  meta_description?: string | null
  meta_keywords?: string
  canonical_url?: string
  robots?: string
  og_image?: string | null
}

export interface Page {
  id: number
  slug: string
  title: string
  status: string
  is_home: boolean
  template: string
  version: number
  sections_count: number
  total_sections?: number
  version_at?: string | null
  updated_at?: string
  seo?: PageSEO
  sections?: PageSection[]
}

export interface PageSummary {
  id: number
  slug: string
  title: string
  status: string
  is_home: boolean
  template: string
  version: number
  sections_count: number
  updated_at: string
}

export interface SectionTypeInfo {
  section_type: string
  name: string
  description: string
  icon: string
  default_config: SectionConfig
  available_locales: string[]
}

export interface PageBuilderRegistry {
  section_types: SectionTypeInfo[]
  pages: PageSummary[]
}

export interface Announcement {
  is_enabled: boolean
  text: string
  link: string
  link_label: string
  dismissible: boolean
  background_color: string
  text_color: string
  start_at: string | null
  end_at: string | null
}

export interface HeroConfig {
  headline?: string
  subtitle?: string
  primary_cta_label?: string
  primary_cta_url?: string
  secondary_cta_label?: string
  secondary_cta_url?: string
  align?: "center" | "start"
  show_grid?: boolean
  show_mesh?: boolean
  show_particles?: boolean
}

export interface SectionRenderRecord {
  id: number
  type: string
  startedAt: number
  durationMs: number
  status: "loaded" | "error" | "fallback" | "skipped"
}
