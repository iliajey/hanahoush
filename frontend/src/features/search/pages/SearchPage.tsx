import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useSeoMeta } from "@/features/cms/seo/useSeoMeta"
import { useLanguage } from "@/shared/hooks"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { SearchInput } from "../components/SearchInput"
import { SearchResults } from "../components/SearchResults"
import { useDebouncedValue, useGlobalSearch } from "../hooks"
import { searchAnalytics } from "../services/analytics"
import type { SearchResultType } from "../types"

const ALL_TYPES = "__all__"

/**
 * Public site-wide search page (/search).
 *
 * URL-driven (q / type / category) so results are shareable; noindex by design
 * because search result pages add no standalone value for crawlers.
 */
export function SearchPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlQuery = searchParams.get("q") ?? ""
  const urlType = (searchParams.get("type") as SearchResultType | null) ?? ""
  const [typed, setTyped] = useState(urlQuery)
  const [submitted, setSubmitted] = useState(urlQuery.trim().length > 0)

  const query = useDebouncedValue(typed)
  const search = useGlobalSearch({
    q: submitted ? query : "",
    type: urlType || "",
    locale: language,
  })

  useSeoMeta({ title: t("search.title"), robots: "noindex,follow" }, language)

  useEffect(() => {
    searchAnalytics.view()
  }, [])

  // Debounced submit: navigate the URL as the user types (shareable results).
  useEffect(() => {
    if (!submitted || query.trim().length === 0) return
    const params = new URLSearchParams(searchParams)
    params.set("q", query.trim())
    if (urlType) params.set("type", urlType)
    else params.delete("type")
    setSearchParams(params, { replace: true })
    searchAnalytics.submit(query.trim())
  }, [query])

  const onTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== ALL_TYPES) params.set("type", value)
    else params.delete("type")
    setSearchParams(params, { replace: true })
    searchAnalytics.filter({ type: value === ALL_TYPES ? null : value })
  }

  const onSearch = () => {
    setSubmitted(true)
    searchAnalytics.submit(typed.trim())
  }

  const onClear = useCallback(() => {
    setTyped("")
    setSubmitted(false)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  return (
    <PageWrapper title={t("search.title")} description={t("search.description")}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form
            className="flex-1"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch()
            }}
          >
            <SearchInput
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              onClear={onClear}
              hasValue={typed.length > 0}
              placeholder={t("search.placeholder")}
              label={t("search.placeholder")}
            />
          </form>
          <Select value={urlType || ALL_TYPES} onValueChange={onTypeChange} aria-label={t("search.filterLabel")}>
            <SelectTrigger className="w-[180px]" aria-label={t("search.filterLabel")}>
              <SelectValue placeholder={t("search.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>{t("search.allTypes")}</SelectItem>
              <SelectItem value="article">{t("search.types.article")}</SelectItem>
              <SelectItem value="project">{t("search.types.project")}</SelectItem>
              <SelectItem value="service">{t("search.types.service")}</SelectItem>
              <SelectItem value="page">{t("search.types.page")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SearchResults
          results={search.data?.items ?? []}
          total={search.data?.pagination.count ?? 0}
          query={query.trim()}
          isLoading={search.isLoading}
          isError={search.isError}
          hasSearched={submitted && query.trim().length > 0}
          onRetry={() => search.refetch()}
        />
      </div>
    </PageWrapper>
  )
}