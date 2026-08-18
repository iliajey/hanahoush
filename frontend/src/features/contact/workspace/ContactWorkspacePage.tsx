import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Eye, Search } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { useAdminContacts, useUpdateContactStatus } from "../adminHooks"
import type { AdminContact, ContactStatus } from "../admin"

const STATUS_OPTIONS: Array<{ value: ContactStatus; label: string }> = [
  { value: "new", label: "contactWorkspace.statusNew" },
  { value: "in_progress", label: "contactWorkspace.statusInProgress" },
  { value: "resolved", label: "contactWorkspace.statusResolved" },
  { value: "closed", label: "contactWorkspace.statusClosed" },
  { value: "spam", label: "contactWorkspace.statusSpam" },
]

const STATUS_VARIANT: Record<ContactStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
  spam: "destructive",
}

export function ContactWorkspacePage() {
  const { t } = useTranslation()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<ContactStatus | "all">("all")

  const params = { q: q || undefined, status: status === "all" ? undefined : status, pageSize: 50 }
  const { data, isLoading, isError } = useAdminContacts(params)
  const { change, handled } = useUpdateContactStatus()
  const [detail, setDetail] = useState<AdminContact | null>(null)
  const [detailStatus, setDetailStatus] = useState<ContactStatus>("new")

  const openDetail = (contact: AdminContact) => {
    setDetailStatus(contact.status)
    setDetail(contact)
  }

  const saveStatus = () => {
    if (!detail || detailStatus === detail.status) return
    change.mutate(
      { id: detail.id, status: detailStatus },
      {
        onSuccess: () => {
          setDetail((prev) => (prev ? { ...prev, status: detailStatus } : prev))
        },
      },
    )
  }

  return (
    <PageWrapper title={t("contactWorkspace.title")} description={t("contactWorkspace.subtitle")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("contactWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("contactWorkspace.searchPlaceholder")}
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as ContactStatus | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("contactWorkspace.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("contactWorkspace.allStatuses")}</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : isError ? (
            <EmptyState title={t("contactWorkspace.errorTitle")} description={t("contactWorkspace.errorDescription")} />
          ) : !data?.items.length ? (
            <EmptyState title={t("contactWorkspace.empty")} description={t("contactWorkspace.emptyDescription")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">{t("contactWorkspace.column.name")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("contactWorkspace.column.email")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("contactWorkspace.column.subject")}</th>
                    <th className="px-4 py-3 text-start font-medium">{t("contactWorkspace.column.status")}</th>
                    <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("contactWorkspace.column.received")}</th>
                    <th className="px-4 py-3 text-end font-medium">{t("contactWorkspace.column.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((contact) => (
                    <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{contact.name}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">{contact.email}</td>
                      <td className="hidden max-w-[16rem] truncate px-4 py-3 md:table-cell">{contact.subject || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[contact.status]}>{t(`contactWorkspace.status.${contact.status}`)}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(contact)}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            {t("contactWorkspace.inspect")}
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

      {/* Detail dialog */}
      <Dialog open={detail != null} onOpenChange={(open) => { if (!open) setDetail(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.column.email")}</Label>
                <p dir="ltr">{detail.email}</p>
              </div>
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.phone")}</Label>
                <p dir="ltr">{detail.phone || "—"}</p>
              </div>
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.company")}</Label>
                <p>{detail.company || "—"}</p>
              </div>
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.source")}</Label>
                <p dir="ltr">{detail.source || "—"}</p>
              </div>
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.serviceCategory")}</Label>
                <p>{detail.service_category || "—"}</p>
              </div>
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.budgetRange")}</Label>
                <p>{detail.budget_range || "—"}</p>
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label>{t("contactWorkspace.message")}</Label>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3">{detail.message}</p>
              </div>
              <div className="grid gap-1">
                <Label>{t("contactWorkspace.status")}</Label>
                <Select value={detailStatus} onValueChange={(value) => setDetailStatus(value as ContactStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              {t("common.close")}
            </Button>
            {detail?.status === "new" ? (
              <Button variant="secondary" onClick={() => detail && handled.mutate(detail.id)}>
                {t("contactWorkspace.markHandled")}
              </Button>
            ) : null}
            <Button onClick={saveStatus} disabled={!detail || detailStatus === detail.status}>
              {t("contactWorkspace.updateStatus")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}