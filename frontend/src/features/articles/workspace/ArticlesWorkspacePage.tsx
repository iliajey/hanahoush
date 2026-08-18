import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { ExternalLink, Pencil, Plus, Search, Send, Workflow } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import {
  useSubmitForReviewMutation,
  useWorkflowForContent,
  useEnsureWorkflowMutation,
} from "@/features/editorial/hooks"

import { useStaffArticles } from "../hooks/staff"
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
            <Workflow className="h-4 w-4" />
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
          <Send className="h-4 w-4" />
          {t("articleWorkspace.submitForReview")}
        </Button>
      ) : null}
    </div>
  )
}

export function ArticlesWorkspacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useAuthorization()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<ArticleStatus | "all">("all")
  const { data, isLoading, isError } = useStaffArticles({
    q: q || undefined,
    status: status === "all" ? undefined : status,
    pageSize: 50,
  })

  const canWrite = can(CAPABILITIES.CONTENT_ARTICLES_WRITE)

  return (
    <PageWrapper title={t("articleWorkspace.title")} description={t("articleWorkspace.subtitle")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("articleWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("articleWorkspace.searchPlaceholder")}
          />
        </div>
        <Tabs value={status} onValueChange={(value) => setStatus(value as ArticleStatus | "all")}>
          <TabsList className="flex-wrap">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {canWrite ? (
          <Button onClick={() => navigate("/dashboard/articles/new")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("articleWorkspace.createDraft")}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : isError ? (
            <EmptyState title={t("articleWorkspace.errorTitle")} description={t("articleWorkspace.errorDescription")} />
          ) : !data?.items.length ? (
            <EmptyState title={t("articleWorkspace.empty")} description={t("articleWorkspace.emptyDescription")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">{t("articleWorkspace.column.article")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("articleWorkspace.column.status")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("articleWorkspace.column.workflow")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("articleWorkspace.column.updated")}</th>
                    <th className="px-4 py-3 text-end font-medium">{t("articleWorkspace.column.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((article) => (
                    <tr key={article.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="max-w-[24rem] truncate font-medium">
                          {article.title_en || article.title_fa || article.slug}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{article.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[article.status] ?? "outline"}>{article.status_display}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <ArticleWorkflowLink article={article} />
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                        {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canWrite ? (
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/articles/${article.id}/edit`)}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t("articleWorkspace.edit")}</span>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/articles/${article.slug}`}>
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
    </PageWrapper>
  )
}