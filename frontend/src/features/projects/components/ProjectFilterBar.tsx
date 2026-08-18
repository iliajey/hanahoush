import { FilterX, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { projectAnalytics } from "../services/analytics"
import type { ProjectCategoryRefSummary, ProjectFilters, ProjectTechnologyRef } from "../types"

/**
 * Project discovery filters (category / technology / year / search / featured).
 * Filtering is delegated to the backend API via the existing project endpoints.
 */
export function ProjectFilterBar({
  filters,
  onChange,
  categories,
  technologies,
  years,
  count,
}: {
  filters: ProjectFilters
  onChange: (next: ProjectFilters) => void
  categories: ProjectCategoryRefSummary[]
  technologies: ProjectTechnologyRef[]
  years: number[]
  count: number
}) {
  const { t } = useTranslation()
  const set = (patch: Partial<ProjectFilters>) => {
    const next = { ...filters, ...patch }
    onChange(next)
    projectAnalytics.filter(patch)
    if (patch.q !== undefined) projectAnalytics.search(patch.q ?? "")
    if (patch.technologySlug !== undefined) projectAnalytics.technologyFilter(patch.technologySlug ?? "")
  }

  const hasActiveFilters =
    Boolean(filters.categoryId) ||
    Boolean(filters.technologySlug) ||
    Boolean(filters.year) ||
    Boolean(filters.q) ||
    Boolean(filters.featuredOnly)

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
<select
          aria-label={t("filters.category")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={filters.categoryId ?? ""}
          onChange={(e) => set({ categoryId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{t("filters.allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.title_en}</option>
          ))}
        </select>

        <select
          aria-label={t("filters.technology")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={filters.technologySlug ?? ""}
          onChange={(e) => set({ technologySlug: e.target.value || undefined })}
        >
          <option value="">{t("filters.allTechnologies")}</option>
          {technologies.map((tech) => (
            <option key={tech.slug} value={tech.slug}>{tech.title_en}</option>
          ))}
        </select>

        <select
          aria-label={t("filters.year")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={filters.year ?? ""}
          onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{t("filters.allYears")}</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="relative flex-1 items-center gap-2 sm:max-w-xs">
          <SearchX className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
<Input
            placeholder={t("filters.searchProjects")}
            className="h-9 pl-8"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            aria-label={t("filters.searchProjects")}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={Boolean(filters.featuredOnly)}
            onChange={(e) => set({ featuredOnly: e.target.checked })}
          />
          {t("filters.featuredOnly")}
        </label>

        {hasActiveFilters ? (
          <Button size="sm" variant="ghost" onClick={() => onChange({ pageSize: filters.pageSize })}>
            <FilterX className="mr-1 h-4 w-4" /> {t("filters.clear")}
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("filters.projectCount", { count })}</p>
    </div>
  )
}
