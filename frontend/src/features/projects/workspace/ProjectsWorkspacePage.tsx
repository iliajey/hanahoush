import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { ExternalLink, Pencil, Plus, Search } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useStaffProjects } from "../hooks/staff"
import type { ProjectStatus } from "../api/staff"

const STATUS_TABS: Array<{ value: ProjectStatus | "all"; label: string }> = [
  { value: "all", label: "projectWorkspace.statusAll" },
  { value: "draft", label: "projectWorkspace.statusDraft" },
  { value: "review", label: "projectWorkspace.statusReview" },
  { value: "published", label: "projectWorkspace.statusPublished" },
  { value: "archived", label: "projectWorkspace.statusArchived" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  review: "outline",
  published: "default",
  archived: "destructive",
}

export function ProjectsWorkspacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<ProjectStatus | "all">("all")

  const { data, isLoading, isError } = useStaffProjects({
    q: q || undefined,
    status: status === "all" ? undefined : status,
    pageSize: 50,
  })

  return (
    <PageWrapper title={t("projectWorkspace.title")} description={t("projectWorkspace.subtitle")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("projectWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("projectWorkspace.searchPlaceholder")}
          />
        </div>
        <Tabs value={status} onValueChange={(value) => setStatus(value as ProjectStatus | "all")}>
          <TabsList className="flex-wrap">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={() => navigate("/dashboard/projects/new")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("projectWorkspace.newProject")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : isError ? (
            <EmptyState title={t("projectWorkspace.errorTitle")} description={t("projectWorkspace.errorDescription")} />
          ) : !data?.items.length ? (
            <EmptyState title={t("projectWorkspace.empty")} description={t("projectWorkspace.emptyDescription")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">{t("projectWorkspace.column.project")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("projectWorkspace.column.status")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("projectWorkspace.column.client")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("projectWorkspace.column.year")}</th>
                    <th className="px-4 py-3 text-end font-medium">{t("projectWorkspace.column.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((project) => (
                    <tr key={project.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="max-w-[24rem] truncate font-medium">
                          {project.title_en || project.title_fa || project.slug}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{project.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[project.status] ?? "outline"}>{project.status_display}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">{project.client || "—"}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">{project.year ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("projectWorkspace.edit")}</span>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/projects/${project.slug}`}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t("projectWorkspace.openCaseStudy")}</span>
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