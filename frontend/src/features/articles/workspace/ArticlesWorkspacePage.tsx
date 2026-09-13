import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ExternalLink, Eye, Pencil, Plus, Search, Send, Workflow } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import { useDebounce } from "@/shared/hooks"
import {
  useSubmitForReviewMutation,
  useWorkflowForContent,
  useEnsureWorkflowMutation,
} from "@/features/editorial/hooks"

import { useStaffArticles } from "../hooks/staff"
import { useArticleCategories } from "../hooks"
import type { ArticleStatus, StaffArticle } from "../api/staff"

const STATUS_TABS: Array<{ value: ArticleStatus | "all"; label: string }> = [
  { value: "all", label: "articleWorkspace.statusAll" },
  { value: "draft", label: "articleWorkspace.statusDraft" },
  { value: "review", label: "articleWorkspace.statusReview" },
  { value: "published", label: "articleWorkspace.statusPublished" },
  { value: "archived", label: "articleWorkspace.statusArchived" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  review: "outline",
  published: "default",
  archived: "destructive",
}

const PAGE_SIZE = 20

function ArticleWorkflowLink({ article }: { article: StaffArticle }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: workflows, isLoading } = useWorkflowForContent("articles.article", article.id)
  const ensure = useEnsureWorkflowMutation("articles.article", article.id)
  const submit = useSubmitForReviewMutation(workflows?.[0]?.id ?? 0)
  const { can } = useAuthorization()
  const workflow = workflows?.[0]

  if (isLoading) return <Skeleton className="h-5 w-32" />

  if (!workflow) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline">{t("articleWorkspace.noWorkflow")}</Badge>
        {can(CAPABILITIES.EDITORIAL_MANAGE) ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={ensure.isPending}
            onClick={() =>
              ensure.mutate(undefined, {
                onSuccess: (data) => navigate(`/dashboard/editorial/${data.id}`),
              })
            }
          >
            <Workflow className="h-4 w-4" aria-hidden="true" />
            {t("articleWorkspace.startReview")}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to={`/dashboard/editorial/${workflow.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <Workflow className="h-4 w-4" aria-hidden="true" />
        {t(`workflowStage.${workflow.stage.code}`)}
      </Link>
      {workflow.stage.code === "draft" && can(CAPABILITIES.EDITORIAL_MANAGE) ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={submit.isPending}
          onClick={() => submit.mutate({ comment: t("articleWorkspace.submitComment") })}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {t("articleWorkspace.submitForReview")}
        </Button>
      ) : null}
    </div>
  )
}

export function ArticlesWorkspacePage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const { can } = useAuthorization()
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState("")
  const initialStatus = searchParams.get("status")
  const [status, setStatus] = useState<ArticleStatus | "all">(
    initialStatus === "draft" || initialStatus === "review" || initialStatus === "published" || initialStatus === "archived"
      ? initialStatus
      : "all",
  )
  const [category, setCategory] = useState<string>("all")
  const [featured, setFeatured] = useState<"all" | "only" | "exclude">("all")
  const [ordering, setOrdering] = useState("-updated_at")
  const [page, setPage] = useState(1)

  const debouncedQ = useDebounce(q.trim(), 350)
  const categoriesQuery = useArticleCategories()

  const params = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: status === "all" ? undefined : status,
      category: category === "all" ? undefined : Number(category),
      is_featured: featured === "all" ? undefined : featured === "only",
      ordering,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedQ, status, category, featured, ordering, page],
  )
  const { data, isLoading, isError, refetch } = useStaffArticles(params)

  const resetPage = () => setPage(1)
  const totalPages = data?.pagination?.num_pages ?? 0
  const activeFilterCount =
    (status !== "all" ? 1 : 0) + (category !== "all" ? 1 : 0) + (featured !== "all" ? 1 : 0) + (debouncedQ ? 1 : 0)

  const clearFilters = () => {
    setQ("")
    setStatus("all")
    setCategory("all")
    setFeatured("all")
    setOrdering("-updated_at")
    setPage(1)
  }

  const canWrite = can(CAPABILITIES.CONTENT_ARTICLES_WRITE)

  return (
    <PageWrapper
      title={t("articleWorkspace.title")}
      description={t("articleWorkspace.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("articleWorkspace.title") },
      ]}
      actions={
        canWrite ? (
          <Button onClick={() => navigate("/dashboard/articles/new")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("articleWorkspace.createDraft")}
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => {
              setQ(event.target.value)
              resetPage()
            }}
            placeholder={t("articleWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("articleWorkspace.searchPlaceholder")}
          />
        </div>
        <Tabs
          value={status}
          onValueChange={(value) => {
            setStatus(value as ArticleStatus | "all")
            resetPage()
          }}
          className="min-w-0 max-w-full"
        >
          <TabsList className="max-w-full flex-wrap justify-start">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value)
            resetPage()
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label={t("articleWorkspace.filters.category")}>
            <SelectValue placeholder={t("articleWorkspace.filters.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("articleWorkspace.filters.categoryAll")}</SelectItem>
            {(categoriesQuery.data ?? []).map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {language === "fa" ? item.title_fa || item.title_en : item.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={featured}
          onValueChange={(value) => {
            setFeatured(value as typeof featured)
            resetPage()
          }}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label={t("articleWorkspace.filters.featured")}>
            <SelectValue placeholder={t("articleWorkspace.filters.featured")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("articleWorkspace.filters.featuredAll")}</SelectItem>
            <SelectItem value="only">{t("articleWorkspace.filters.featuredOnly")}</SelectItem>
            <SelectItem value="exclude">{t("articleWorkspace.filters.featuredExclude")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ordering} onValueChange={(value) => { setOrdering(value); resetPage() }}>
          <SelectTrigger className="w-full sm:w-52" aria-label={t("articleWorkspace.sort.label")}>
            <SelectValue placeholder={t("articleWorkspace.sort.label")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-updated_at">{t("articleWorkspace.sort.updatedDesc")}</SelectItem>
            <SelectItem value="-created_at">{t("articleWorkspace.sort.createdDesc")}</SelectItem>
            <SelectItem value="-published_at">{t("articleWorkspace.sort.publishedDesc")}</SelectItem>
            <SelectItem value="title_en">{t("articleWorkspace.sort.titleAsc")}</SelectItem>
          </SelectContent>
        </Select>

        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t("articleWorkspace.clearFilters")} ({activeFilterCount})
          </Button>
        ) : null}

        {data?.pagination ? (
          <span className="ms-auto text-xs text-muted-foreground" aria-live="polite">
            {t("articleWorkspace.totalCount", { count: data.pagination.count })}
          </span>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4" role="status" aria-live="polite">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState
                title={t("articleWorkspace.errorTitle")}
                description={t("articleWorkspace.errorDescription")}
                onRetry={() => void refetch()}
              />
            </div>
          ) : !data?.items.length ? (
            <div className="p-4">
              <EmptyState
                title={t("articleWorkspace.empty")}
                description={t("articleWorkspace.emptyDescription")}
                action={
                  canWrite && activeFilterCount === 0 ? (
                    <Button size="sm" onClick={() => navigate("/dashboard/articles/new")}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {t("articleWorkspace.createDraft")}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <caption className="sr-only">{t("articleWorkspace.title")}</caption>
                <thead>
                  <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 text-start font-medium">{t("articleWorkspace.column.article")}</th>
                    <th scope="col" className="px-4 py-3 text-start font-medium">{t("articleWorkspace.column.status")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("articleWorkspace.column.workflow")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("articleWorkspace.column.updated")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-medium">{t("articleWorkspace.column.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((article) => (
                    <tr key={article.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="max-w-[24rem] truncate font-medium">
                            {article.title_en || article.title_fa || article.slug}
                          </div>
                          {article.is_featured ? (
                            <Badge variant="outline" className="shrink-0">{t("articleWorkspace.filters.featured")}</Badge>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground" dir="ltr">{article.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[article.status] ?? "outline"}>{article.status_display}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <ArticleWorkflowLink article={article} />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground lg:table-cell" dir="ltr">
                        {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canWrite ? (
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/articles/${article.id}/edit`)} title={t("articleWorkspace.edit")}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t("articleWorkspace.edit")}</span>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/articles/${article.id}/preview`)} title={t("articleWorkspace.previewLink")}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("articleWorkspace.previewLink")}</span>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/articles/${article.slug}`} title={t("articleWorkspace.view")}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t("articleWorkspace.view")}</span>
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <Pagination
          className="mt-4"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(next) => setPage(Math.min(Math.max(1, next), totalPages))}
        />
      ) : null}
    </PageWrapper>
  )
}
