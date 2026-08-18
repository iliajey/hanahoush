import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, Power, Search } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useNewsletterExport, useNewsletterSubscribers, useToggleSubscriber } from "../hooks"

type ActiveFilter = "all" | "active" | "inactive"

export function NewsletterWorkspacePage() {
  const { t } = useTranslation()
  const [q, setQ] = useState("")
  const [active, setActive] = useState<ActiveFilter>("all")

  const params = {
    q: q || undefined,
    is_active: active === "active" ? true : active === "inactive" ? false : undefined,
    pageSize: 100,
  }
  const { data, isLoading, isError } = useNewsletterSubscribers(params)
  const { activate, deactivate } = useToggleSubscriber()
  const exportCsv = useNewsletterExport(params)

  return (
    <PageWrapper title={t("newsletterWorkspace.title")} description={t("newsletterWorkspace.subtitle")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("newsletterWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("newsletterWorkspace.searchPlaceholder")}
          />
        </div>
        <Select value={active} onValueChange={(value) => setActive(value as ActiveFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("newsletterWorkspace.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("newsletterWorkspace.statusActive")}</SelectItem>
            <SelectItem value="inactive">{t("newsletterWorkspace.statusInactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("newsletterWorkspace.export")}
        </Button>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">{t("newsletterWorkspace.privacyNote")}</p>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : isError ? (
            <EmptyState title={t("newsletterWorkspace.errorTitle")} description={t("newsletterWorkspace.errorDescription")} />
          ) : !data?.items.length ? (
            <EmptyState title={t("newsletterWorkspace.empty")} description={t("newsletterWorkspace.emptyDescription")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">{t("newsletterWorkspace.column.email")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("newsletterWorkspace.column.locale")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("newsletterWorkspace.column.source")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("newsletterWorkspace.column.status")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("newsletterWorkspace.column.subscribedAt")}</th>
                    <th className="px-4 py-3 text-end font-medium">{t("newsletterWorkspace.column.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium" dir="ltr">{subscriber.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{subscriber.locale}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{subscriber.source || "—"}</td>
                      <td className="px-4 py-3">
                        {subscriber.is_active ? (
                          <Badge variant="success">{t("newsletterWorkspace.statusActive")}</Badge>
                        ) : (
                          <Badge variant="secondary">{t("newsletterWorkspace.statusInactive")}</Badge>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                        {subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {subscriber.is_active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deactivate.isPending}
                              onClick={() => deactivate.mutate(subscriber.id)}
                            >
                              <Power className="h-4 w-4 text-destructive" aria-hidden="true" />
                              <span className="sr-only">{t("newsletterWorkspace.deactivate")}</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={activate.isPending}
                              onClick={() => activate.mutate(subscriber.id)}
                            >
                              <Power className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                              <span className="sr-only">{t("newsletterWorkspace.activate")}</span>
                            </Button>
                          )}
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