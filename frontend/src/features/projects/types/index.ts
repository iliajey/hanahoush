import type { MediaRef, Technology } from "@/features/cms/types"

export interface ProjectTechnologyRef {
  id: number
  title_en: string
  title_fa?: string
  slug: string
  icon?: string
  projects_count?: number
}

export interface ProjectCategoryRefSummary {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
  projects_count?: number
}

export interface ProjectCategoryRef {
  id: number
  title_fa?: string
  title_en: string
  slug: string
}

export interface ProjectImageRef {
  id: number
  image: number
  image_url: string
  alt_text_fa?: string
  alt_text_en?: string
  alt_text_ar?: string
  is_cover?: boolean
}

/** Structured, localized case-study content (from Project.case_study). */
export interface CaseStudyData {
  challenge?: string
  objectives?: string
  solution_approach?: string
  architecture?: {
    description?: string
    nodes?: Array<{ layer: string; labels?: Array<string | { en?: string }> }>
  } | null
  implementation_stages?: Array<{ stage?: string; detail?: string }>
  results?: string
}

export interface ProjectCaseStudy {
  id: number
  slug: string
  title: string
  title_fa?: string
  title_en: string
  title_ar?: string
  short_description?: string
  short_description_fa?: string
  short_description_en?: string
  short_description_ar?: string
  description?: string
  category: ProjectCategoryRef | null
  technologies: Technology[]
  client?: string
  location?: string
  cover_image: MediaRef | null
  start_date?: string | null
  end_date?: string | null
  year?: number | null
  live_url?: string
  images: ProjectImageRef[]
  is_featured: boolean
  is_public: boolean
  is_published?: boolean
  status?: string
  case_study: CaseStudyData
  related_projects: ProjectSummary[]
  related_articles: Array<{ id: number; slug: string; title: string; description?: string }>
}

export interface ProjectSummary {
  id: number
  slug: string
  title_fa?: string
  title_en: string
  title: string
  short_description?: string
  description?: string
  category: ProjectCategoryRef | null
  technologies: Technology[]
  cover_image: MediaRef | null
  client?: string
  start_date?: string | null
  end_date?: string | null
  year?: number | null
  is_featured: boolean
  is_public: boolean
}

export interface ProjectFilters {
  categoryId?: number
  technologySlug?: string
  year?: number
  q?: string
  featuredOnly?: boolean
  page?: number
  pageSize?: number
}

export interface ProjectsQueryResult {
  items: ProjectSummary[]
  count: number
}