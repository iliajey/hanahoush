import type { Technology } from "@/features/cms/types"

import type { ProjectCaseStudy, ProjectSummary } from "../types"

/** Human label from a localized project/category/technology ref. */
export function localizedLabel(
  value: { title_fa?: string; title_en: string; title_ar?: string },
  locale: string,
): string {
  if (locale === "fa" && value.title_fa) return value.title_fa
  if (locale === "ar" && value.title_ar) return value.title_ar
  return value.title_en ?? ""
}

/** Completion year of a project (end_date primarily, else start_date). */
export function projectYear(project: { end_date?: string | null; start_date?: string | null }): number | null {
  const raw = project.end_date || project.start_date
  if (!raw) return null
  const year = new Date(raw).getFullYear()
  return Number.isNaN(year) ? null : year
}

/** Stable list of technology titles (English canonical) for a project. */
export function technologyNames(technologies: Technology[]): string[] {
  return technologies.map((tech) => tech.title_en || tech.title_fa || tech.slug)
}

/** Serialize the license-safe "projects_count" from the explorer response. */
export function technologyCount(tech: { projects_count?: number }): number {
  return tech.projects_count ?? 0
}

export function isFeatured(project: ProjectSummary | ProjectCaseStudy): boolean {
  return Boolean(project.is_featured)
}

export function formatYear(year: number | null | undefined, locale: string): string {
  if (!year) return ""
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale).format(year)
}