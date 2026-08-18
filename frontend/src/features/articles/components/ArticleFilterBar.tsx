import { FilterX, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { articleAnalytics } from "../services/analytics"
import type { ArticleFilters, ArticleCategorySummary, ArticleTagSummary } from "../types"

/** Article discovery filters + search (server-side via the Article API). */
export function ArticleFilterBar({
  filters,
  onChange,
  categories,
  tags,
  count,
}: {
  filters: ArticleFilters
  onChange: (next: ArticleFilters) => void
  categories: ArticleCategorySummary[]
  tags: ArticleTagSummary[]
  count: number
}) {
  const { t } = useTranslation()
  const set = (patch: Partial<ArticleFilters>) => {
    const next = { ...filters, ...patch, page: 1 }
    onChange(next)
    articleAnalytics.filter(patch)
    if (patch.q !== undefined) articleAnalytics.search(patch.q ?? "")
  }

  const active =
    Boolean(filters.q) || Boolean(filters.categorySlug) || Boolean(filters.tagSlug) || Boolean(filters.featuredOnly)

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.searchArticles")}
            className="h-9 pl-8"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            aria-label={t("filters.searchArticles")}
          />
        </div>

        <select
          aria-label={t("filters.category")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={filters.categorySlug ?? ""}
          onChange={(e) => {
            articleAnalytics.categoryClick(e.target.value)
            set({ categorySlug: e.target.value || undefined })
          }}
        >
          <option value="">{t("filters.allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>{category.title_en}</option>
          ))}
        </select>

        <select
          aria-label={t("filters.topic")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={filters.tagSlug ?? ""}
          onChange={(e) => {
            articleAnalytics.tagClick(e.target.value)
            set({ tagSlug: e.target.value || undefined })
          }}
        >
          <option value="">{t("filters.allTopics")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>{tag.title_en}</option>
          ))}
        </select>

        <select
          aria-label={t("filters.sort")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={filters.ordering ?? ""}
          onChange={(e) => set({ ordering: e.target.value || undefined })}
        >
          <option value="-published_at">{t("filters.newestFirst")}</option>
          <option value="published_at">{t("filters.oldestFirst")}</option>
          <option value="title_en">{t("filters.titleAtoZ")}</option>
        </select>

        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" checked={Boolean(filters.featuredOnly)} onChange={(e) => set({ featuredOnly: e.target.checked })} />
          {t("filters.featured")}
        </label>

        {active ? (
          <Button size="sm" variant="ghost" onClick={() => onChange({ pageSize: filters.pageSize })}>
            <FilterX className="mr-1 h-4 w-4" /> {t("filters.clear")}
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("articleList.count", { count })}</p>
    </div>
  )
}