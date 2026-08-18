import type { Locale, Project } from "../types"

/** View model consumed by marketing ProjectCard components. */
export interface ProjectView {
  id: number
  title: string
  description: string
  image?: string
  tags: string[]
  client?: string
  featured?: boolean
  slug: string
  endDate?: string | null
}

export function mapProject(project: Project, _locale: Locale): ProjectView {
  const description =
    project.short_description || project.short_description_en || project.description || ""
  return {
    id: project.id,
    title: project.title || project.title_en,
    description,
    image: project.cover_image?.file,
    tags: project.technologies.map((tech) => tech.title_en || tech.title_fa || tech.slug),
    client: project.client,
    featured: project.is_featured,
    slug: project.slug,
    endDate: project.end_date,
  }
}

export function mapProjects(items: Project[], locale: Locale): ProjectView[] {
  return items.map((item) => mapProject(item, locale))
}
