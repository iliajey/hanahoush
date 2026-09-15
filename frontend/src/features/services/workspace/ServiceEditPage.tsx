import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Check, Eye, ImagePlus, Loader2 } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ContentHealthPanel, StudioLocaleSelect, type HealthItem, type StudioLocale } from "@/components/ui"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MediaPicker } from "@/features/media/components/MediaPicker"
import type { MediaFile } from "@/features/media/types"
import { toApiError } from "@/shared/api/axiosClient"
import { resolveMediaFile, resolveMediaUrl } from "@/shared/lib"
import { useDirtyGuard } from "@/shared/hooks"
import { studioLocaleFromSearchParams } from "@/shared/lib/studioLocale"
import { RichTextEditor, editorStatsFor } from "../../articles/workspace/RichTextEditor"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import {
  useEnsureWorkflowMutation,
  usePublishMutation,
  useScheduleMutation,
  useSubmitForReviewMutation,
  useWorkflow,
  useWorkflowForContent,
} from "@/features/editorial/hooks"
import { PublicationPanel } from "@/features/editorial/components"
import { scheduleActionError } from "@/features/editorial/api"
import { OgImageField, SeoPreviewCard, seoHealthItems } from "@/features/cms/seo"

import { useCreateStaffService, useServiceSectionsStaff, useStaffService, useUpdateStaffService } from "../hooks/staff"
import { ServiceIconPicker } from "./ServiceIconPicker"
import type { ServiceStatus } from "../api/staff"

const STATUS_OPTIONS: Array<{ value: ServiceStatus; label: string }> = [
  { value: "draft", label: "serviceWorkspace.statusDraft" },
  { value: "review", label: "serviceWorkspace.statusReview" },
  { value: "published", label: "serviceWorkspace.statusPublished" },
  { value: "archived", label: "serviceWorkspace.statusArchived" },
]

const AUTOSAVE_DELAY_MS = 30000

type Trilingual = Record<StudioLocale, string>
const emptyTrilingual = (): Trilingual => ({ fa: "", en: "", ar: "" })

/** Services Studio (Phase 15.5): single-locale editing workspace matching the
 * Article/Project Studio language — locale dropdown, cover picker, section
 * picker, actionable health, autosave + dirty guard, trilingual preview
 * parity. Reuses every existing Service model field; no new schema. */
export function ServiceEditPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id
  const serviceId = id ? Number(id) : undefined

  const { data: service, isLoading, isError, refetch } = useStaffService(isNew ? undefined : serviceId)
  const create = useCreateStaffService()
  const update = useUpdateStaffService(isNew ? undefined : serviceId)
  const sectionsQuery = useServiceSectionsStaff()

  const [searchParams] = useSearchParams()
  const [editingLocale, setEditingLocale] = useState<StudioLocale>(() =>
    studioLocaleFromSearchParams(searchParams, language === "fa" || language === "ar" ? language : "en"),
  )
  const [titles, setTitles] = useState<Trilingual>(emptyTrilingual)
  const [excerpts, setExcerpts] = useState<Trilingual>(emptyTrilingual)
  const [bodies, setBodies] = useState<Trilingual>(emptyTrilingual)
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [sectionId, setSectionId] = useState<string>("none")
  const [icon, setIcon] = useState("")
  const [sortOrder, setSortOrder] = useState("0")
  const [coverId, setCoverId] = useState<number | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [ogId, setOgId] = useState<number | null>(null)
  const [ogPreview, setOgPreview] = useState<string | null>(null)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [canonicalUrl, setCanonicalUrl] = useState("")
  const [status, setStatus] = useState<ServiceStatus>("draft")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<"cover" | "og" | "body">("cover")
  const [imageSignal, setImageSignal] = useState<{ url: string; alt: string; nonce: number } | null>(null)

  const hydratedFor = useRef<number | string | null>(null)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  const snapshotRef = useRef("")
  const { can } = useAuthorization()
  const workflowsQuery = useWorkflowForContent("services.service", serviceId)
  const ensureWorkflow = useEnsureWorkflowMutation("services.service", serviceId ?? 0)
  const workflowId = workflowsQuery.data?.[0]?.id ?? 0
  const submitReview = useSubmitForReviewMutation(workflowId)
  const scheduleMut = useScheduleMutation(workflowId)
  const publishMut = usePublishMutation(workflowId)
  const workflowDetail = useWorkflow(workflowId)
  const canSubmitReview = can(CAPABILITIES.EDITORIAL_MANAGE)
  const canSchedule = can(CAPABILITIES.EDITORIAL_SCHEDULE)
  const canPublish = can(CAPABILITIES.EDITORIAL_MANAGE)

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        titles, excerpts, bodies, slug, sectionId, icon, sortOrder, coverId, ogId,
        metaTitle, metaDescription, canonicalUrl, status, isFeatured, isPublic,
      }),
    [titles, excerpts, bodies, slug, sectionId, icon, sortOrder, coverId, ogId,
      metaTitle, metaDescription, canonicalUrl, status, isFeatured, isPublic],
  )

  useEffect(() => {
    if (!service || hydratedFor.current === service.id) return
    hydratedFor.current = service.id
    const detail = service as typeof service & {
      description_en?: string
      description_fa?: string
      description_ar?: string
      meta_title?: string
      meta_description?: string
      canonical_url?: string
      cover_image?: { id: number; file: string } | null
      og_image?: { id: number; file: string } | null
    }
    setTitles({ en: service.title_en ?? "", fa: service.title_fa ?? "", ar: service.title_ar ?? "" })
    setSlug(service.slug ?? "")
    setSlugTouched(true)
    setExcerpts({
      en: service.short_description_en ?? "",
      fa: service.short_description_fa ?? "",
      ar: service.short_description_ar ?? "",
    })
    setBodies({
      en: detail.description_en ?? "",
      fa: detail.description_fa ?? "",
      ar: detail.description_ar ?? "",
    })
    setSectionId(service.section ? String(service.section.id) : "none")
    setIcon(service.icon ?? "")
    setSortOrder(String(service.sort_order ?? 0))
    setCoverId(detail.cover_image?.id ?? null)
    setCoverPreview(resolveMediaUrl(detail.cover_image?.file) ?? null)
    setOgId(detail.og_image?.id ?? null)
    setOgPreview(resolveMediaUrl(detail.og_image?.file) ?? null)
    setMetaTitle(detail.meta_title ?? "")
    setMetaDescription(detail.meta_description ?? "")
    setCanonicalUrl(detail.canonical_url ?? "")
    setStatus(service.status)
    setIsFeatured(service.is_featured)
    setIsPublic(service.is_public)
    setDirty(false)
  }, [service])

  useEffect(() => {
    if (hydratedFor.current == null && !isNew) return
    if (snapshotRef.current === "") {
      snapshotRef.current = snapshot
      return
    }
    setDirty(snapshot !== snapshotRef.current)
  }, [snapshot, isNew])

  useEffect(() => {
    if (slugTouched || isNew === false) return
    const source = titles.en || titles.fa || titles.ar
    setSlug(
      source
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .slice(0, 200),
    )
  }, [titles, slugTouched, isNew])

  const buildPayload = useCallback(
    (nextStatus: ServiceStatus) => ({
      title_en: titles.en,
      title_fa: titles.fa,
      title_ar: titles.ar,
      slug: slug.trim(),
      short_description_en: excerpts.en,
      short_description_fa: excerpts.fa,
      short_description_ar: excerpts.ar,
      description_en: bodies.en,
      description_fa: bodies.fa,
      description_ar: bodies.ar,
      section: sectionId === "none" ? null : Number(sectionId),
      icon: icon.trim().toLowerCase() || undefined,
      cover_image: coverId,
      og_image: ogId,
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      canonical_url: canonicalUrl || undefined,
      status: nextStatus,
      is_featured: isFeatured,
      is_public: isPublic,
      sort_order: Number(sortOrder) || 0,
    }),
    [titles, excerpts, bodies, slug, sectionId, icon, sortOrder, coverId, ogId,
      metaTitle, metaDescription, canonicalUrl, isFeatured, isPublic],
  )

  const persist = useCallback(
    (nextStatus: ServiceStatus, opts: { silent?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        if (!opts.silent) {
          setError(null)
          setFieldErrors({})
        }
        const onError = (e: unknown) => {
          const apiError = toApiError(e)
          if (!opts.silent) {
            setError(apiError.message || t("serviceWorkspace.saveFailed"))
            const raw = apiError.errors
            if (raw && typeof raw === "object" && !Array.isArray(raw)) {
              const mapped: Record<string, string> = {}
              for (const [field, messages] of Object.entries(raw as Record<string, unknown>)) {
                const message = Array.isArray(messages) ? messages[0] : messages
                if (typeof message === "string" && message) mapped[field] = message
              }
              setFieldErrors(mapped)
            }
          }
          resolve(false)
        }
        const onSuccess = () => {
          snapshotRef.current = JSON.stringify({
            titles, excerpts, bodies, slug, sectionId, icon, sortOrder, coverId, ogId,
            metaTitle, metaDescription, canonicalUrl, status: nextStatus, isFeatured, isPublic,
          })
          setSavedAt(new Date().toISOString())
          setDirty(false)
          if (!opts.silent) setStatus(nextStatus)
          resolve(true)
        }
        if (isNew) {
          create.mutate(buildPayload(nextStatus), { onSuccess, onError })
        } else if (serviceId != null) {
          update.mutate(buildPayload(nextStatus), { onSuccess, onError })
        } else {
          resolve(false)
        }
      }),
    [serviceId, buildPayload, create, isNew, t, update,
      titles, excerpts, bodies, slug, sectionId, icon, sortOrder, coverId, ogId,
      metaTitle, metaDescription, canonicalUrl, isFeatured, isPublic],
  )

  const pending = create.isPending || update.isPending

  useEffect(() => {
    if (isNew || !dirty) return
    const timer = window.setTimeout(() => {
      if (dirtyRef.current) void persist(status, { silent: true })
    }, AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [snapshot, isNew, dirty, status, persist])

  useDirtyGuard(dirty)

  const handleManualSave = async () => {
    const ok = await persist(status)
    if (ok) navigate("/dashboard/services")
  }

  const handleSubmitReview = async () => {
    const ok = await persist("review")
    if (!ok || serviceId == null) return
    try {
      if (!workflowsQuery.data?.length) {
        const created = await ensureWorkflow.mutateAsync(undefined)
        navigate(`/dashboard/editorial/${created.id}`)
        return
      }
      await submitReview.mutateAsync({ comment: "Submit for review" })
      navigate(`/dashboard/editorial/${workflowId}`)
    } catch (e) {
      setError(toApiError(e).message || t("serviceWorkspace.saveFailed"))
    }
  }

  const handlePickMedia = (media: MediaFile) => {
    setPickerOpen(false)
    const url = resolveMediaFile(media) ?? ""
    if (pickerMode === "cover") {
      setCoverId(media.id)
      setCoverPreview(url || null)
    } else if (pickerMode === "og") {
      setOgId(media.id)
      setOgPreview(url || null)
    } else {
      setImageSignal({ url, alt: media.alt_text_en || media.title_en || media.original_name, nonce: Date.now() })
    }
  }

  const completeness = useMemo(
    () => ({
      fa: [titles.fa, excerpts.fa, bodies.fa].every((v) => v.trim().length > 0),
      en: [titles.en, excerpts.en, bodies.en].every((v) => v.trim().length > 0),
      ar: [titles.ar, excerpts.ar, bodies.ar].every((v) => v.trim().length > 0),
    }),
    [titles, excerpts, bodies],
  )

  const healthItems: HealthItem[] = useMemo(() => {
    const items: HealthItem[] = []
    if (!slug.trim()) {
      items.push({ key: "slug", severity: "critical", message: t("studio.health.missingSlug"), target: "service-slug" })
    }
    for (const locale of ["fa", "en", "ar"] as const) {
      const name = locale.toUpperCase()
      if (!titles[locale].trim()) {
        items.push({
          key: `title-${locale}`, severity: "critical",
          message: t("studio.health.missingTitle", { locale: name }),
          target: "service-title", locale,
        })
      }
      if (!excerpts[locale].trim()) {
        items.push({
          key: `excerpt-${locale}`, severity: "warning",
          message: t("studio.health.missingSummary", { locale: name }),
          target: "service-excerpt", locale,
        })
      }
      if (editorStatsFor(bodies[locale]).words < 30) {
        items.push({
          key: `body-${locale}`, severity: "warning",
          message: t("studio.health.thinBody", { locale: name }),
          target: "service-body", locale,
        })
      }
    }
    if (coverId == null) {
      items.push({ key: "cover", severity: "warning", message: t("studio.health.missingCover"), target: "service-cover" })
    }
    if (sectionId === "none") {
      items.push({ key: "section", severity: "warning", message: t("serviceWorkspace.healthNoSection"), target: "service-section" })
    }
    return items
  }, [slug, titles, excerpts, bodies, coverId, sectionId, t])

  const healthStats = useMemo(() => {
    const words =
      editorStatsFor(bodies.en).words + editorStatsFor(bodies.fa).words + editorStatsFor(bodies.ar).words
    const readingMinutes = Math.max(1, Math.ceil(words / 200))
    return [
      { label: t("serviceWorkspace.totalWords"), value: words },
      { label: t("serviceWorkspace.readingTime", { count: readingMinutes }), value: `${readingMinutes} min` },
      { label: t("serviceWorkspace.sortOrder"), value: Number(sortOrder) || 0 },
    ]
  }, [bodies, sortOrder, t])

  const seoItems = useMemo(
    () =>
      seoHealthItems(
        {
          slug,
          meta_title: metaTitle,
          meta_description: metaDescription,
          canonical_url: canonicalUrl,
          og_image: (ogPreview ?? coverPreview) ? { file: (ogPreview ?? coverPreview) as string } : null,
          title_en: titles.en,
          title_fa: titles.fa,
          title_ar: titles.ar,
        },
        t,
        { title: "service-meta-title", description: "service-meta-description", slug: "service-slug", canonical: "service-canonical", og: "service-og" },
      ),
    [slug, metaTitle, metaDescription, canonicalUrl, ogPreview, coverPreview, titles, t],
  )

  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? <p className="text-xs text-destructive">{fieldErrors[name]}</p> : null

  const localeDir = editingLocale === "en" ? "ltr" : "rtl"

  const handleHealthNavigate = (item: HealthItem) => {
    if (item.locale) setEditingLocale(item.locale)
  }

  if (isLoading) {
    return (
      <PageWrapper title={t("serviceWorkspace.form.editTitle")}>
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-10" />
          <Skeleton className="h-64" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || (!isNew && !service)) {
    return (
      <PageWrapper title={t("serviceWorkspace.form.editTitle")}>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t("serviceWorkspace.loadFailed")}</CardContent>
          <CardContent className="flex gap-2 px-6 pb-6">
            <Button variant="outline" onClick={() => void refetch()}>{t("errors.retry")}</Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard/services">{t("common.back")}</Link>
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={isNew ? t("serviceWorkspace.form.createTitle") : t("serviceWorkspace.form.editTitle")}
      description={t("serviceWorkspace.form.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("serviceWorkspace.title"), href: "/dashboard/services" },
        { label: isNew ? t("serviceWorkspace.form.createTitle") : (service?.slug ?? "") },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StudioLocaleSelect value={editingLocale} onChange={setEditingLocale} completeness={completeness} id="service-locale" />
          {savedAt ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status">
              <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
              {dirty ? t("serviceWorkspace.unsavedChanges") : t("serviceWorkspace.savedAt", { time: new Date(savedAt).toLocaleTimeString() })}
            </span>
          ) : dirty ? (
            <Badge variant="outline">{t("serviceWorkspace.unsavedChanges")}</Badge>
          ) : null}
          {!isNew && serviceId != null ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/services/${serviceId}/preview`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                {t("serviceWorkspace.preview")}
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("serviceWorkspace.form.identity")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="service-title">{t(`serviceWorkspace.form.title${editingLocale.toUpperCase()}`)}</Label>
                <Input id="service-title" value={titles[editingLocale]} onChange={(e) => setTitles((prev) => ({ ...prev, [editingLocale]: e.target.value }))} dir="auto" />
                <FieldError name={`title_${editingLocale}`} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-slug">{t("serviceWorkspace.form.slug")}</Label>
                <Input
                  id="service-slug"
                  value={slug}
                  dir="ltr"
                  placeholder="my-service-slug"
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(e.target.value)
                  }}
                />
                <FieldError name="slug" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-section">{t("serviceWorkspace.form.section")}</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger id="service-section">
                    <SelectValue placeholder={t("serviceWorkspace.form.sectionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("serviceWorkspace.form.noSection")}</SelectItem>
                    {(sectionsQuery.data ?? []).map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {language === "fa" ? (item.title_fa || item.title_en) : item.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ServiceIconPicker value={icon} onChange={setIcon} />
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="service-order">{t("serviceWorkspace.form.sortOrder")}</Label>
                <Input id="service-order" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} dir="ltr" className="max-w-40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t("serviceWorkspace.coverTitle")}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => { setPickerMode("cover"); setPickerOpen(true) }}>
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  {t("serviceWorkspace.chooseCover")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coverPreview ? (
                <div id="service-cover" className="overflow-hidden rounded-xl border">
                  <img src={coverPreview} alt={titles[editingLocale] || slug} className="aspect-[21/9] h-full w-full object-cover" loading="lazy" />
                </div>
              ) : (
                <p id="service-cover" className="text-sm text-muted-foreground">{t("serviceWorkspace.noCover")}</p>
              )}
              {coverId != null ? (
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setCoverId(null); setCoverPreview(null) }}>
                  {t("serviceWorkspace.removeCover")}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("serviceWorkspace.form.content")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="service-excerpt">{t(`serviceWorkspace.excerpt${editingLocale.toUpperCase()}`)}</Label>
                <Textarea
                  id="service-excerpt"
                  rows={2}
                  value={excerpts[editingLocale]}
                  onChange={(e) => setExcerpts((prev) => ({ ...prev, [editingLocale]: e.target.value }))}
                  dir="auto"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="service-body">{t(`serviceWorkspace.form.description${editingLocale.toUpperCase()}`)}</Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t("serviceWorkspace.wordCount", { count: editorStatsFor(bodies[editingLocale]).words })}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setPickerMode("body"); setPickerOpen(true) }}>
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("serviceWorkspace.insertImage")}
                    </Button>
                  </div>
                </div>
                <RichTextEditor
                  id="service-body"
                  label={t(`serviceWorkspace.form.description${editingLocale.toUpperCase()}`)}
                  value={bodies[editingLocale]}
                  onChange={(value) => setBodies((prev) => ({ ...prev, [editingLocale]: value }))}
                  dir={localeDir}
                  placeholder={t(`serviceWorkspace.form.description${editingLocale.toUpperCase()}`)}
                  disabled={pending}
                  onInsertImage={() => { setPickerMode("body"); setPickerOpen(true) }}
                  externalImageSignal={imageSignal}
                />
                <FieldError name={`description_${editingLocale}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("serviceWorkspace.form.publishing")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="service-status">{t("serviceWorkspace.form.status")}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ServiceStatus)}>
                  <SelectTrigger id="service-status">
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
                <p className="text-xs text-muted-foreground">{t("serviceWorkspace.statusHint")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isFeatured} onCheckedChange={(checked) => setIsFeatured(Boolean(checked))} />
                  {t("serviceWorkspace.form.isFeatured")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
                  {t("serviceWorkspace.form.isPublic")}
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div className="grid gap-2">
                  <Label htmlFor="service-meta-title">{t("serviceWorkspace.metaTitle")}</Label>
                  <Input id="service-meta-title" value={metaTitle} maxLength={70} onChange={(e) => setMetaTitle(e.target.value)} dir="auto" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service-meta-description">{t("serviceWorkspace.metaDescription")}</Label>
                  <Textarea id="service-meta-description" rows={2} value={metaDescription} maxLength={160} onChange={(e) => setMetaDescription(e.target.value)} dir="auto" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service-canonical">Canonical URL</Label>
                  <Input id="service-canonical" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} dir="ltr" placeholder="https://" />
                  <FieldError name="canonical_url" />
                </div>
                <div className="grid gap-2 lg:col-span-1 sm:col-span-2">
                  <OgImageField
                    id="service-og"
                    preview={ogPreview ?? coverPreview}
                    onChoose={() => { setPickerMode("og"); setPickerOpen(true) }}
                    onRemove={() => { setOgId(null); setOgPreview(null) }}
                  />
                  <FieldError name="og_image" />
                </div>
              </div>
            </CardContent>
          </Card>

          <ContentHealthPanel items={[...healthItems, ...seoItems]} stats={healthStats} onNavigate={handleHealthNavigate} />

          {/* Decision A: services render as sections of the /services hub
              (no /services/:slug route), so the preview URL targets the hub. */}
          <SeoPreviewCard
            title={metaTitle || titles[editingLocale] || slug}
            description={metaDescription || excerpts[editingLocale]}
            url={typeof window !== "undefined" ? `${window.location.origin}/services` : `/services`}
            robots="index,follow"
            locale={editingLocale}
            image={ogPreview ?? coverPreview}
          />

          {!isNew && serviceId != null ? (
            <PublicationPanel
              status={status}
              workflowStage={workflowDetail.data?.stage.code ?? workflowsQuery.data?.[0]?.stage.code ?? "draft"}
              scheduledFor={workflowDetail.data?.schedules.find((s) => s.status === "scheduled")?.scheduled_for ?? null}
              publishedAt={service?.published_at ?? null}
              canSubmit={canSubmitReview}
              canSchedule={canSchedule}
              canPublish={canPublish}
              pending={pending || scheduleMut.isPending || publishMut.isPending}
              localeCompleteness={completeness}
              blocking={scheduleActionError(scheduleMut.error ?? publishMut.error).blocking}
              actionError={scheduleActionError(scheduleMut.error ?? publishMut.error).message}
              onSubmit={() => void handleSubmitReview()}
              onSchedule={(when) => scheduleMut.mutate(when)}
              onPublish={() => publishMut.mutate({ soft: false })}
            />
          ) : null}

          <div className="flex flex-col gap-2">
            <Button onClick={() => void handleManualSave()} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isNew ? t("serviceWorkspace.createDraft") : t("common.save")}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard/services">{t("common.cancel")}</Link>
            </Button>
          </div>
        </aside>
      </div>

      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={handlePickMedia} title={t("serviceWorkspace.mediaTitle")} />
    </PageWrapper>
  )
}
