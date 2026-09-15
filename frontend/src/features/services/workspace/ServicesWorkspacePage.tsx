import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ExternalLink, Eye, Pencil, Plus, Search } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Pagination } from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import { useDebounce } from "@/shared/hooks"

import { useServiceSectionsStaff, useStaffServices } from "../hooks/staff"
import type { ServiceStatus } from "../api/staff"

const STATUS_TABS: Array<{ value: ServiceStatus | "all"; label: string }> = [
  { value: "all", label: "serviceWorkspace.statusAll" },
  { value: "draft", label: "serviceWorkspace.statusDraft" },
  { value: "review", label: "serviceWorkspace.statusReview" },
  { value: "published", label: "serviceWorkspace.statusPublished" },
  { value: "archived", label: "serviceWorkspace.statusArchived" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  review: "outline",
  published: "default",
  archived: "destructive",
}

export function ServicesWorkspacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useAuthorization()
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState("")
  const initialStatus = searchParams.get("status")
  const [status, setStatus] = useState<ServiceStatus | "all">(
    initialStatus === "draft" || initialStatus === "review" || initialStatus === "published" || initialStatus === "archived"
      ? initialStatus
      : "all",
  )
  const [section, setSection] = useState<string>("all")
  const [page, setPage] = useState(1)

  const debouncedQ = useDebounce(q.trim(), 350)
  const sectionsQuery = useServiceSectionsStaff()
  const params = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: status === "all" ? undefined : status,
      section: section === "all" ? undefined : Number(section),
      page,
      pageSize: 20,
    }),
    [debouncedQ, status, section, page],
  )
  const { data, isLoading, isError, refetch } = useStaffServices(params)
  const totalPages = data?.pagination?.num_pages ?? 0
  const canWrite = can(CAPABILITIES.CONTENT_SERVICES_WRITE)

  return (
    <PageWrapper
      title={t("serviceWorkspace.title")}
      description={t("serviceWorkspace.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("serviceWorkspace.title") },
      ]}
      actions={
        canWrite ? (
          <Button onClick={() => navigate("/dashboard/services/new")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("serviceWorkspace.newService")}
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
              setPage(1)
            }}
            placeholder={t("serviceWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("serviceWorkspace.searchPlaceholder")}
          />
        </div>
        <Tabs
          value={status}
          onValueChange={(value) => {
            setStatus(value as ServiceStatus | "all")
            setPage(1)
          }}
        >
          <TabsList className="flex-wrap">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select
          value={section}
          onValueChange={(value) => {
            setSection(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label={t("serviceWorkspace.filters.section")}>
            <SelectValue placeholder={t("serviceWorkspace.filters.section")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("serviceWorkspace.filters.sectionAll")}</SelectItem>
            {(sectionsQuery.data ?? []).map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data?.pagination ? (
          <span className="ms-auto text-xs text-muted-foreground" aria-live="polite">
            {t("serviceWorkspace.totalCount", { count: data.pagination.count })}
          </span>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4" role="status" aria-live="polite">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState
                title={t("serviceWorkspace.errorTitle")}
                description={t("serviceWorkspace.errorDescription")}
                onRetry={() => void refetch()}
              />
            </div>
          ) : !data?.items.length ? (
            <div className="p-4">
              <EmptyState
                title={t("serviceWorkspace.empty")}
                description={t("serviceWorkspace.emptyDescription")}
                action={
                  canWrite ? (
                    <Button size="sm" onClick={() => navigate("/dashboard/services/new")}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {t("serviceWorkspace.newService")}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <caption className="sr-only">{t("serviceWorkspace.title")}</caption>
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 text-start font-medium">{t("serviceWorkspace.column.service")}</th>
                    <th scope="col" className="px-4 py-3 text-start font-medium">{t("serviceWorkspace.column.status")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("serviceWorkspace.column.section")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("serviceWorkspace.column.order")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-medium">{t("serviceWorkspace.column.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((service) => (
                    <tr key={service.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="max-w-0 px-4 py-3">
                        <div className="max-w-[10rem] truncate font-medium sm:max-w-[24rem]">
                          {service.title_en || service.title_fa || service.slug}
                        </div>
                        <div className="truncate text-xs text-muted-foreground" dir="ltr">{service.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[service.status] ?? "outline"}>{service.status_display}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">{service.section?.title_en || "—"}</td>
                      <td className="hidden px-4 py-3 tabular-nums lg:table-cell">{service.sort_order}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canWrite ? (
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/services/${service.id}/edit`)} title={t("serviceWorkspace.edit")}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t("serviceWorkspace.edit")}</span>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/services/${service.id}/preview`)} title={t("serviceWorkspace.previewLink")}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("serviceWorkspace.previewLink")}</span>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to="/services" title={t("serviceWorkspace.view")}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t("serviceWorkspace.view")}</span>
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
