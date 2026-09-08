/** Super Admin user-management workspace page (Phase 11.5).
 *
 * Responsive table of accounts with search, role/active/staff filters,
 * sorting and pagination. All data comes from the backend user-management
 * API; this page renders no password material of any kind.
 */
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, ShieldCheck, UserPlus } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useUser } from "@/features/auth/hooks/useUser"
import { useActivateUser, useDeactivateUser, useRoleCatalog, useUsers } from "../hooks"
import type { ManagedUser } from "../types"
import { UserFormDialog } from "../components/UserFormDialog"
import { RolePermissionsDialog, UserDetailDialog } from "../components/UserDetailDialog"

type ActiveFilter = "all" | "active" | "inactive"
type StaffFilter = "all" | "staff" | "nonstaff"
type SortField = "username" | "date_joined" | "last_login"
type SortDir = "asc" | "desc"

export function UsersWorkspacePage() {
  const { t } = useTranslation()
  const { user: currentUser } = useUser()

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [staffFilter, setStaffFilter] = useState<StaffFilter>("all")
  const [sortField, setSortField] = useState<SortField>("username")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [detail, setDetail] = useState<ManagedUser | null>(null)
  const [rolesOpen, setRolesOpen] = useState(false)

  const roles = useRoleCatalog()
  const activate = useActivateUser()
  const deactivate = useDeactivateUser()

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      isActive: activeFilter === "all" ? undefined : activeFilter === "active",
      isStaff: staffFilter === "all" ? undefined : staffFilter === "staff",
      ordering: `${sortDir === "desc" ? "-" : ""}${sortField}`,
    }),
    [page, search, roleFilter, activeFilter, staffFilter, sortField, sortDir],
  )

  const { data, isLoading, isError } = useUsers(params)

  const lifecycleError =
    activate.isError || deactivate.isError ? t("users.messages.saveFailed") : null

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const pagination = data?.pagination
  const canPrev = Boolean(pagination && pagination.current_page > 1)
  const canNext = Boolean(pagination && pagination.current_page < pagination.num_pages)

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      aria-label={`${label} — ${t("users.table.sort")}`}
    >
      {label}
      {sortField === field ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : null}
    </button>
  )

  return (
    <PageWrapper title={t("users.page.title")} description={t("users.page.description")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
            placeholder={t("users.search.placeholder")}
            className="ps-9"
            aria-label={t("users.search.placeholder")}
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setPage(1)
            setRoleFilter(value)
          }}
        >
          <SelectTrigger className="w-44" aria-label={t("users.filters.role")}>
            <SelectValue placeholder={t("users.filters.role")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filters.allRoles")}</SelectItem>
            {(roles.data ?? []).map((role) => (
              <SelectItem key={role.id} value={role.codename}>
                {t(`roles.${role.codename}.name`, { defaultValue: role.name })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeFilter}
          onValueChange={(value) => {
            setPage(1)
            setActiveFilter(value as ActiveFilter)
          }}
        >
          <SelectTrigger className="w-40" aria-label={t("users.filters.status")}>
            <SelectValue placeholder={t("users.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filters.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("users.status.active")}</SelectItem>
            <SelectItem value="inactive">{t("users.status.inactive")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={staffFilter}
          onValueChange={(value) => {
            setPage(1)
            setStaffFilter(value as StaffFilter)
          }}
        >
          <SelectTrigger className="w-40" aria-label={t("users.filters.staff")}>
            <SelectValue placeholder={t("users.filters.staff")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filters.allStaff")}</SelectItem>
            <SelectItem value="staff">{t("users.status.staffYes")}</SelectItem>
            <SelectItem value="nonstaff">{t("users.status.staffNo")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="ms-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => setRolesOpen(true)}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("users.actions.viewRoles")}
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {t("users.actions.create")}
          </Button>
        </div>
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
            <EmptyState title={t("users.errors.loadTitle")} description={t("users.errors.loadDescription")} />
          ) : !data?.items.length ? (
            <EmptyState title={t("users.empty.title")} description={t("users.empty.description")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <caption className="sr-only">{t("users.table.caption")}</caption>
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 text-start">
                      <SortHeader field="username" label={t("users.table.username")} />
                    </th>
                    <th scope="col" className="px-4 py-3 text-start">{t("users.table.name")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start md:table-cell">{t("users.table.email")}</th>
                    <th scope="col" className="px-4 py-3 text-start">{t("users.table.role")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start lg:table-cell">{t("users.table.staff")}</th>
                    <th scope="col" className="px-4 py-3 text-start">{t("users.table.status")}</th>
                    <th scope="col" className="hidden px-4 py-3 text-start lg:table-cell">
                      <SortHeader field="last_login" label={t("users.table.lastLogin")} />
                    </th>
                    <th scope="col" className="px-4 py-3 text-end">{t("users.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium" dir="ltr">
                        {user.username}
                        {user.is_superuser ? (
                          <Badge variant="outline" className="ms-2 font-normal">
                            {t("users.status.superuser")}
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell" dir="ltr">
                        {user.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {user.role ? (
                          <Badge variant="secondary">
                            {t(`roles.${user.role.codename}.name`, { defaultValue: user.role.name })}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {user.is_staff ? t("users.status.yes") : t("users.status.no")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.is_active ? "success" : "destructive"}>
                          {user.is_active ? t("users.status.active") : t("users.status.inactive")}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-xs text-muted-foreground lg:table-cell" dir="ltr">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : t("users.status.never")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {user.is_active && !user.is_superuser ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deactivate.mutate(user.id)}
                              disabled={deactivate.isPending}
                            >
                              {t("users.actions.deactivate")}
                            </Button>
                          ) : !user.is_active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => activate.mutate(user.id)}
                              disabled={activate.isPending}
                            >
                              {t("users.actions.activate")}
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(user)
                              setFormOpen(true)
                            }}
                          >
                            {t("users.actions.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetail(user)}
                          >
                            {t("users.actions.detail")}
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

      {lifecycleError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">{lifecycleError}</p>
      ) : null}

      {/* Pagination */}
      {pagination && pagination.num_pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between" aria-label={t("users.table.pagination")}>
          <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t("users.table.previous")}
          </Button>
          <span className="text-sm text-muted-foreground" dir="ltr">
            {t("users.table.pageOf", {
              current: pagination.current_page,
              total: pagination.num_pages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(pagination.num_pages, p + 1))}
          >
            {t("users.table.next")}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </nav>
      ) : null}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        currentUserId={currentUser?.id}
      />
      <UserDetailDialog
        open={detail != null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        user={detail}
        currentUserId={currentUser?.id}
      />
      <RolePermissionsDialog
        open={rolesOpen}
        onOpenChange={setRolesOpen}
        roles={roles.data ?? []}
        isLoading={roles.isLoading}
      />
    </PageWrapper>
  )
}
