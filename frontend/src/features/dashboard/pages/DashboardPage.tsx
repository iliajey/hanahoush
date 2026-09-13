import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  Database,
  FileText,
  FolderKanban,
  Hash,
  Images,
  Inbox,
  ListChecks,
  Mail,
  MessagesSquare,
  Newspaper,
  Plus,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { useUser } from "@/features/auth/hooks/useUser"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import { PERMISSIONS } from "@/features/auth/permissions"
import { getRoleDefinition } from "@/features/auth/role-config"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import { workspaceNavForUser, workspaceRouteHref } from "@/app/workspace/workspaceConfig"

import { useOperationalDashboard } from "../hooks"
import { ProfileCard } from "../components/ProfileCard"
import { StatTile } from "../components/StatTile"
import type { OperationalDashboard } from "../types"

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</CardContent>
    </Card>
  )
}

function ViewAllLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
    </Link>
  )
}

/** Drafts / reviews / locks that need a human — derived from live backend data. */
function AttentionQueue({ data }: { data: OperationalDashboard }) {
  const { t } = useTranslation()
  const { can } = useAuthorization()
  const items: Array<{ key: string; label: string; count: number; to: string; show: boolean }> = [
    {
      key: "drafts",
      label: t("dashboard.attention.drafts"),
      count: data.content.articles_drafts,
      to: "/dashboard/articles?status=draft",
      show: can(CAPABILITIES.CONTENT_ARTICLES),
    },
    {
      key: "review",
      label: t("dashboard.attention.awaitingReview"),
      count: data.content.articles_awaiting_review,
      to: "/dashboard/articles?status=review",
      show: can(CAPABILITIES.CONTENT_ARTICLES),
    },
    {
      key: "project-review",
      label: t("dashboard.attention.projectsAwaitingReview"),
      count: data.content.projects_awaiting_review ?? 0,
      to: "/dashboard/projects?status=review",
      show: can(CAPABILITIES.CONTENT_PROJECTS),
    },
    {
      key: "approvals",
      label: t("dashboard.attention.pendingApprovals"),
      count: data.editorial.pending_approvals,
      to: "/dashboard/editorial",
      show: can(CAPABILITIES.EDITORIAL),
    },
    {
      key: "locks",
      label: t("dashboard.attention.activeLocks"),
      count: data.editorial.active_locks,
      to: "/dashboard/editorial",
      show: can(CAPABILITIES.EDITORIAL),
    },
    {
      key: "contact",
      label: t("dashboard.attention.openInquiries"),
      count: data.engagement.contact_requests,
      to: "/dashboard/contact",
      show: can(CAPABILITIES.CONTACT_MANAGE),
    },
  ].filter((item) => item.show && item.count > 0)

  if (!items.length) return null

  return (
    <Card className="border-amber-500/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4 text-amber-600" aria-hidden="true" />
          {t("dashboard.attention.title")}
        </CardTitle>
        <CardDescription>{t("dashboard.attention.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={item.to}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:border-amber-500/50 hover:bg-accent"
              >
                <span className="font-medium">{item.label}</span>
                <Badge variant="secondary" className="tabular-nums">{item.count}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** One-click creation shortcuts gated by write capabilities. */
function QuickActions() {
  const { t } = useTranslation()
  const { can } = useAuthorization()
  const actions = [
    {
      key: "article",
      label: t("dashboard.actions.newArticle"),
      to: "/dashboard/articles/new",
      icon: FileText,
      show: can(CAPABILITIES.CONTENT_ARTICLES_WRITE),
    },
    {
      key: "project",
      label: t("dashboard.actions.newProject"),
      to: "/dashboard/projects/new",
      icon: FolderKanban,
      show: can(CAPABILITIES.CONTENT_PROJECTS_WRITE),
    },
    {
      key: "media",
      label: t("dashboard.actions.uploadMedia"),
      to: "/dashboard/media",
      icon: Images,
      show: can(CAPABILITIES.MEDIA_UPLOAD),
    },
    {
      key: "review",
      label: t("dashboard.actions.reviewQueue"),
      to: "/dashboard/editorial",
      icon: ListChecks,
      show: can(CAPABILITIES.EDITORIAL),
    },
    {
      key: "contact",
      label: t("dashboard.actions.inquiries"),
      to: "/dashboard/contact",
      icon: MessagesSquare,
      show: can(CAPABILITIES.CONTACT_MANAGE),
    },
    {
      key: "newsletter",
      label: t("dashboard.actions.subscribers"),
      to: "/dashboard/newsletter",
      icon: Mail,
      show: can(CAPABILITIES.NEWSLETTER_MANAGE),
    },
  ].filter((action) => action.show)

  if (!actions.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("dashboard.actions.title")}
        </CardTitle>
        <CardDescription>{t("dashboard.actions.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <li key={action.key}>
              <Link
                to={action.to}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
              >
                <action.icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** Staff-only operational dashboard: real aggregates from the backend API. */
function OperationalDashboardSection() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useOperationalDashboard()
  const { can } = useAuthorization()

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState
        title={t("dashboard.errorTitle")}
        description={t("dashboard.errorDescription")}
        onRetry={() => void refetch()}
      />
    )
  }

  const showContent = can(CAPABILITIES.CONTENT_ARTICLES) || can(CAPABILITIES.CONTENT_PROJECTS)

  return (
    <div className="grid gap-6">
      <AttentionQueue data={data} />
      <QuickActions />

      {showContent ? (
        <SectionCard
          title={t("dashboard.widgets.content.title")}
          description={t("dashboard.widgets.content.description")}
          action={can(CAPABILITIES.CONTENT_ARTICLES) ? <ViewAllLink to="/dashboard/articles" label={t("dashboard.viewAll")} /> : undefined}
        >
          {can(CAPABILITIES.CONTENT_ARTICLES) ? (
            <>
              <StatTile label={t("dashboard.widgets.metrics.articlesPublished")} value={data.content.articles_published} icon={Newspaper} />
              <StatTile label={t("dashboard.widgets.metrics.articlesDrafts")} value={data.content.articles_drafts} />
              <StatTile label={t("dashboard.widgets.metrics.articlesAwaitingReview")} value={data.content.articles_awaiting_review} />
              <StatTile label={t("dashboard.widgets.metrics.articlesScheduled")} value={data.content.articles_scheduled} />
            </>
          ) : null}
          {can(CAPABILITIES.CONTENT_PROJECTS) ? (
            <>
              <StatTile label={t("dashboard.widgets.metrics.projectsPublished")} value={data.content.projects_published} icon={FolderKanban} />
              <StatTile label={t("dashboard.widgets.metrics.projectsDrafts")} value={data.content.projects_drafts} />
              <StatTile label={t("dashboard.attention.projectsAwaitingReview")} value={data.content.projects_awaiting_review ?? 0} />
            </>
          ) : null}
          <StatTile label={t("dashboard.widgets.metrics.services")} value={data.content.services} />
        </SectionCard>
      ) : null}

      {showContent &&
      ((data.content.articles_missing_fa ?? 0) +
        (data.content.articles_missing_ar ?? 0) +
        (data.content.projects_missing_fa ?? 0) +
        (data.content.projects_missing_ar ?? 0) >
        0) ? (
        <SectionCard
          title={t("dashboard.translationGaps.title")}
          description={t("dashboard.translationGaps.description")}
        >
          {can(CAPABILITIES.CONTENT_ARTICLES) ? (
            <>
              <StatTile label="FA · Articles" value={data.content.articles_missing_fa ?? 0} />
              <StatTile label="AR · Articles" value={data.content.articles_missing_ar ?? 0} />
            </>
          ) : null}
          {can(CAPABILITIES.CONTENT_PROJECTS) ? (
            <>
              <StatTile label="FA · Projects" value={data.content.projects_missing_fa ?? 0} />
              <StatTile label="AR · Projects" value={data.content.projects_missing_ar ?? 0} />
            </>
          ) : null}
        </SectionCard>
      ) : null}

      {can(CAPABILITIES.EDITORIAL) ? (
        <SectionCard
          title={t("dashboard.widgets.editorial.title")}
          description={t("dashboard.widgets.editorial.description")}
          action={<ViewAllLink to="/dashboard/editorial" label={t("dashboard.viewAll")} />}
        >
          <StatTile label={t("dashboard.widgets.metrics.pendingApprovals")} value={data.editorial.pending_approvals} icon={ListChecks} />
          <StatTile label={t("dashboard.widgets.metrics.rejectedApprovals")} value={data.editorial.rejected_approvals} />
          <StatTile label={t("dashboard.widgets.metrics.scheduledPublications")} value={data.editorial.scheduled_publications} icon={Activity} />
          <StatTile label={t("dashboard.widgets.metrics.activeLocks")} value={data.editorial.active_locks} />
          <StatTile label={t("dashboard.widgets.metrics.recentRevisions")} value={data.editorial.recent_revisions} />
        </SectionCard>
      ) : null}

      {can(CAPABILITIES.ANALYTICS) ? (
        <SectionCard
          title={t("dashboard.widgets.engagement.title")}
          description={t("dashboard.widgets.engagement.description")}
        >
          <StatTile label={t("dashboard.widgets.metrics.pageViews")} value={data.engagement.page_views} />
          <StatTile label={t("dashboard.widgets.metrics.pageViews30d")} value={data.engagement.page_views_30d} />
          <StatTile label={t("dashboard.widgets.metrics.articleViews")} value={data.engagement.article_views} />
          <StatTile label={t("dashboard.widgets.metrics.projectViews")} value={data.engagement.project_views} />
          <StatTile label={t("dashboard.widgets.metrics.contactRequests")} value={data.engagement.contact_requests} />
          <StatTile label={t("dashboard.widgets.metrics.newsletterSubscriptions")} value={data.engagement.newsletter_subscriptions} />
          <StatTile label={t("dashboard.widgets.metrics.searchActivity")} value={data.engagement.search_activity} />
        </SectionCard>
      ) : null}

      {can(CAPABILITIES.MEDIA_LIBRARY) || can(CAPABILITIES.CONTACT_MANAGE) || can(CAPABILITIES.EDITORIAL) ? (
        <SectionCard
          title={t("dashboard.widgets.operations.title")}
          description={t("dashboard.widgets.operations.description")}
        >
          {can(CAPABILITIES.MEDIA_LIBRARY) ? (
            <Card className="sm:col-span-2">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center justify-between text-sm font-semibold">
                  {t("dashboard.widgets.operations.media")}
                  <ViewAllLink to="/dashboard/media" label={t("dashboard.viewAll")} />
                </p>
                {data.operations.recent_media_uploads.length ? (
                  <ul className="space-y-1 text-sm">
                    {data.operations.recent_media_uploads.map((item) => (
                      <li key={item.id} className="truncate text-muted-foreground" dir="auto">
                        {item.original_name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("dashboard.widgets.empty")}</p>
                )}
              </CardContent>
            </Card>
          ) : null}
          {can(CAPABILITIES.CONTACT_MANAGE) ? (
            <Card className="sm:col-span-2">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center justify-between text-sm font-semibold">
                  {t("dashboard.widgets.operations.contact")}
                  <ViewAllLink to="/dashboard/contact" label={t("dashboard.viewAll")} />
                </p>
                {data.operations.recent_contact_requests.length ? (
                  <ul className="space-y-1 text-sm">
                    {data.operations.recent_contact_requests.map((item) => (
                      <li key={item.id} className="truncate text-muted-foreground" dir="auto">
                        {item.name} · {item.subject || item.email}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("dashboard.widgets.empty")}</p>
                )}
              </CardContent>
            </Card>
          ) : null}
          {can(CAPABILITIES.EDITORIAL) ? (
            <Card className="sm:col-span-2">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center justify-between text-sm font-semibold">
                  {t("dashboard.widgets.operations.editorial")}
                  <ViewAllLink to="/dashboard/editorial" label={t("dashboard.viewAll")} />
                </p>
                {data.operations.recent_editorial_activity.length ? (
                  <ul className="space-y-1 text-sm">
                    {data.operations.recent_editorial_activity.map((item) => (
                      <li key={item.id} className="truncate text-muted-foreground" dir="auto">
                        {item.action}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("dashboard.widgets.empty")}</p>
                )}
              </CardContent>
            </Card>
          ) : null}
          {!data.operations.recent_media_uploads.length &&
          !data.operations.recent_contact_requests.length &&
          !data.operations.recent_editorial_activity.length &&
          !(data.operations.recent_articles ?? []).length &&
          !(data.operations.recent_projects ?? []).length ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState title={t("dashboard.widgets.empty")} description={t("dashboard.widgets.operations.emptyDescription")} />
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {(can(CAPABILITIES.CONTENT_ARTICLES) || can(CAPABILITIES.CONTENT_PROJECTS)) &&
      ((data.operations.recent_articles ?? []).length > 0 || (data.operations.recent_projects ?? []).length > 0) ? (
        <SectionCard
          title={t("dashboard.widgets.recent.title")}
          description={t("dashboard.widgets.recent.description")}
        >
          {can(CAPABILITIES.CONTENT_ARTICLES) && (data.operations.recent_articles ?? []).length > 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center justify-between text-sm font-semibold">
                  {t("dashboard.widgets.recent.articles")}
                  <ViewAllLink to="/dashboard/articles" label={t("dashboard.viewAll")} />
                </p>
                <ul className="space-y-1 text-sm">
                  {(data.operations.recent_articles ?? []).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/dashboard/articles/${item.id}/edit`}
                        className="flex items-center justify-between gap-2 truncate rounded-md px-2 py-1 hover:bg-accent"
                      >
                        <span className="truncate" dir="auto">{item.title_en || item.slug}</span>
                        <Badge variant="outline" className="shrink-0">{item.status}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          {can(CAPABILITIES.CONTENT_PROJECTS) && (data.operations.recent_projects ?? []).length > 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center justify-between text-sm font-semibold">
                  {t("dashboard.widgets.recent.projects")}
                  <ViewAllLink to="/dashboard/projects" label={t("dashboard.viewAll")} />
                </p>
                <ul className="space-y-1 text-sm">
                  {(data.operations.recent_projects ?? []).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/dashboard/projects/${item.id}/edit`}
                        className="flex items-center justify-between gap-2 truncate rounded-md px-2 py-1 hover:bg-accent"
                      >
                        <span className="truncate" dir="auto">{item.title_en || item.slug}</span>
                        <Badge variant="outline" className="shrink-0">{item.status}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </SectionCard>
      ) : null}

      {can(CAPABILITIES.SYSTEM) ? (
        <SectionCard title={t("dashboard.widgets.system.title")} description={t("dashboard.widgets.system.description")}>
          <StatTile
            label={t("dashboard.widgets.metrics.database")}
            value={data.system.database.status}
            icon={Database}
            hint={data.system.database.details}
          />
          <StatTile label={t("dashboard.widgets.metrics.cache")} value={data.system.cache.status} icon={Radio} />
          <StatTile
            label={t("dashboard.widgets.metrics.migrations")}
            value={data.system.migrations.status}
            icon={ShieldCheck}
          />
          <StatTile label={t("dashboard.widgets.metrics.environment")} value={data.system.environment} />
          <StatTile label={t("dashboard.widgets.metrics.version")} value={data.system.version} icon={Hash} />
          <StatTile
            label={t("dashboard.widgets.metrics.debug")}
            value={data.system.debug ? t("common.confirm") : t("common.cancel")}
          />
        </SectionCard>
      ) : null}
    </div>
  )
}

/** Non-staff overview (Editor / Viewer): role-aware, read-only, no management
 * actions and no staff-only data. */
function OverviewSection() {
  const { t } = useTranslation()
  const { can, hasPermission } = useAuthorization()
  const canViewArticles = hasPermission(PERMISSIONS.ARTICLES_VIEW)
  const canViewProjects = hasPermission(PERMISSIONS.PROJECTS_VIEW)

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.overview.readOnly.title")}</CardTitle>
          <CardDescription>{t("dashboard.overview.readOnly.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {can(CAPABILITIES.EDITORIAL) ? (
              <li>
                <Link
                  to="/dashboard/editorial"
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
                >
                  <ListChecks className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  {t("dashboard.overview.editorial.title")}
                </Link>
              </li>
            ) : null}
            {canViewArticles ? (
              <li>
                <Link
                  to="/articles"
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
                >
                  <Newspaper className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  {t("nav.articles")}
                </Link>
              </li>
            ) : null}
            {canViewProjects ? (
              <li>
                <Link
                  to="/projects"
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
                >
                  <FolderKanban className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  {t("nav.projects")}
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                to="/services"
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
              >
                <Users className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                {t("nav.services")}
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

/** Role-aware dashboard landing (Part E + Part O, Phase 13 polish). */
export function DashboardPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { user } = useUser()
  const { isStaff, isSuperAdmin } = useAuthorization()

  useSeoMeta({ title: t("nav.dashboard"), robots: "noindex,follow" }, language)

  const role = getRoleDefinition(user?.role?.codename ?? null)
  const workspaceTitle = role ? t(role.workspaceTitleKey) : t("navWorkspace.dashboard")
  const workspaceDescription = role ? t(role.workspaceDescriptionKey) : t("dashboard.intro")
  const quickNav = workspaceNavForUser(user)

  return (
    <PageWrapper title={workspaceTitle} description={workspaceDescription}>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{t("navWorkspace.label")}</Badge>
        {role ? <Badge variant="secondary">{t(role.nameKey)}</Badge> : null}
        {isSuperAdmin ? (
          <Link to="/dashboard/users" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {t("dashboard.manageUsers")}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr]">
        <div className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:self-start">
          <ProfileCard />
          {quickNav.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.quickLinksTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {quickNav.flatMap((group) =>
                    group.items.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={workspaceRouteHref(item)}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </Link>
                      </li>
                    )),
                  )}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          {isStaff ? (
            <OperationalDashboardSection />
          ) : (
            <OverviewSection />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
