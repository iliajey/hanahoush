import type { MediaRef, Project, Technology } from "@/features/cms/types"

import type { CaseStudyData, ProjectCaseStudy, ProjectImageRef, ProjectSummary } from "../types"

export interface FeaturedProjectView {
  id: number
  slug: string
  title: string
  description: string
  image?: string
  client?: string
  year?: number
  technologies: string[]
  category?: string
  featured: boolean
}

function endYear(endDate?: string | null): number | undefined {
  if (!endDate) return undefined
  const year = new Date(endDate).getFullYear()
  return Number.isNaN(year) ? undefined : year
}

/** Accepts the CMS Project type or the project-summary type. */
export function mapProjectSummary(project: Project | ProjectSummary): FeaturedProjectView {
  const title = project.title || project.title_en
  const description = project.short_description || project.description || ""
  const category = project.category ? (project.category.title_en || "") : ""
  const year = "year" in project ? project.year ?? endYear(project.end_date) : endYear(project.end_date)
  return {
    id: project.id,
    slug: project.slug,
    title,
    description,
    image: project.cover_image?.file,
    client: project.client,
    year,
    technologies: (project.technologies ?? []).map((tech) => tech.title_en || tech.slug),
    category,
    featured: Boolean(project.is_featured),
  }
}

export function mapTechnologyChips(technologies: Technology[]): string[] {
  return technologies.map((tech) => tech.title_en || tech.slug)
}

export function mapGallery(images: ProjectImageRef[]): Array<{ src: string; alt: string; caption?: string }> {
  return images.map((image) => ({
    src: image.image_url,
    alt: image.alt_text_en || image.alt_text_fa || image.alt_text_ar || "Project image",
    caption: image.alt_text_en || image.alt_text_fa || image.alt_text_ar,
  }))
}

export function mapCaseStudyData(caseStudy: CaseStudyData): CaseStudyData {
  return caseStudy
}

export function projectImage(project: Pick<ProjectCaseStudy, "cover_image">): MediaRef | null {
  return project.cover_image
}

export function relatedArticleTitle(article: { title?: string; title_en?: string }): string {
  return article.title || article.title_en || ""
}