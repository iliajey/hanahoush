import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowUp, ArrowDown, Check, Eye, ImagePlus, Loader2, Star, Trash2 } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ContentHealthPanel, StudioLocaleSelect, type HealthItem } from "@/components/ui"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { MediaPicker } from "@/features/media/components/MediaPicker"
import type { MediaFile } from "@/features/media/types"
import { toApiError } from "@/shared/api/axiosClient"
import { resolveMediaFile, resolveMediaUrl } from "@/shared/lib"
import { useDirtyGuard } from "@/shared/hooks"
import { studioLocaleFromSearchParams } from "@/shared/lib/studioLocale"

import {
  useAddProjectGalleryImage,
  useProjectGallery,
  useRemoveProjectGalleryImage,
  useReorderProjectGallery,
  useCreateStaffProject,
  useStaffProject,
  useUpdateProjectGalleryImage,
  useUpdateStaffProject,
} from "../hooks/staff"
import { useProjectCategories, useProjectTechnologies } from "../hooks"
import { RichTextEditor, editorStatsFor } from "../../articles/workspace/RichTextEditor"
import type { ProjectStatus } from "../api/staff"
import {
  CASE_STUDY_LOCALES,
  caseStudyHasText,
  caseStudyToForm,
  emptyCaseStudyForm,
  formToCaseStudy,
  leafHasText,
  localizedLeaf,
  type CaseStudyForm,
  type StudioLocale,
} from "./caseStudy"
import { CaseStudyEditor } from "./CaseStudyEditor"

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "draft", label: "projectWorkspace.statusDraft" },
  { value: "review", label: "projectWorkspace.statusReview" },
  { value: "published", label: "projectWorkspace.statusPublished" },
  { value: "archived", label: "projectWorkspace.statusArchived" },
]

const AUTOSAVE_DELAY_MS = 30000

type Trilingual = Record<StudioLocale, string>
const emptyTrilingual = (): Trilingual => ({ fa: "", en: "", ar: "" })

/** Project Studio 2.0 (Phase 15): single-locale editing workspace with a
 * dropdown language selector, purpose-built case-study editor (challenge /
 * objectives / solution / stages / architecture / results — exactly the
 * public sections), gallery, actionable content health, trilingual preview
 * parity, autosave + dirty guard, and the submit-for-review workflow. */
export function ProjectEditPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id
  const projectId = id ? Number(id) : undefined
  const { can } = useAuthorization()

  const { data: project, isLoading, isError, refetch } = useStaffProject(isNew ? undefined : projectId)
  const create = useCreateStaffProject()
  const update = useUpdateStaffProject(isNew ? undefined : projectId)
  const categoriesQuery = useProjectCategories()
  const technologiesQuery = useProjectTechnologies()
  const galleryQuery = useProjectGallery(isNew ? undefined : projectId)
  const addGallery = useAddProjectGalleryImage(isNew ? undefined : projectId)
  const patchGallery = useUpdateProjectGalleryImage(isNew ? undefined : projectId)
  const removeGallery = useRemoveProjectGalleryImage(isNew ? undefined : projectId)
  const reorderGallery = useReorderProjectGallery(isNew ? undefined : projectId)

  const [searchParams] = useSearchParams()
  const [editingLocale, setEditingLocale] = useState<StudioLocale>(() =>
    studioLocaleFromSearchParams(searchParams, language === "fa" || language === "ar" ? language : "en"),
  )
  const [titles, setTitles] = useState<Trilingual>(emptyTrilingual)
  const [excerpts, setExcerpts] = useState<Trilingual>(emptyTrilingual)
  const [bodies, setBodies] = useState<Trilingual>(emptyTrilingual)
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [categoryId, setCategoryId] = useState("none")
  const [techIds, setTechIds] = useState<number[]>([])
  const [client, setClient] = useState("")
  const [location, setLocation] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [coverId, setCoverId] = useState<number | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [ogId, setOgId] = useState<number | null>(null)
  const [ogPreview, setOgPreview] = useState<string | null>(null)
  const [caseStudy, setCaseStudy] = useState<CaseStudyForm>(emptyCaseStudyForm)
  const [hiddenSections, setHiddenSections] = useState<Record<string, boolean>>({})
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [canonicalUrl, setCanonicalUrl] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("draft")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<"cover" | "og" | "gallery" | "body">("cover")
  const [imageSignal, setImageSignal] = useState<{ url: string; alt: string; nonce: number } | null>(null)

  const hydratedFor = useRef<number | string | null>(null)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  const snapshotRef = useRef("")

  const workflowsQuery = useWorkflowForContent("projects.project", projectId)
  const ensureWorkflow = useEnsureWorkflowMutation("projects.project", projectId ?? 0)
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
        titles, excerpts, bodies, slug, categoryId, techIds, client, location, liveUrl,
        startDate, endDate, coverId, ogId, caseStudy, hiddenSections,
        metaTitle, metaDescription, canonicalUrl, status, isFeatured, isPublic,
      }),
    [titles, excerpts, bodies, slug, categoryId, techIds, client, location, liveUrl,
      startDate, endDate, coverId, ogId, caseStudy, hiddenSections,
      metaTitle, metaDescription, canonicalUrl, status, isFeatured, isPublic],
  )

  useEffect(() => {
    if (!project || hydratedFor.current === project.id) return
    hydratedFor.current = project.id
    const detail = project as typeof project & {
      description_en?: string
      description_fa?: string
      description_ar?: string
      meta_title?: string
      meta_description?: string
      canonical_url?: string
      cover_image?: { id: number; file: string } | null
      og_image?: { id: number; file: string } | null
      case_study_raw?: Parameters<typeof caseStudyToForm>[0]
    }
    setTitles({ en: project.title_en ?? "", fa: project.title_fa ?? "", ar: project.title_ar ?? "" })
    setSlug(project.slug ?? "")
    setSlugTouched(true)
    setExcerpts({
      en: project.short_description_en ?? "",
      fa: project.short_description_fa ?? "",
      ar: project.short_description_ar ?? "",
    })
    setBodies({
      en: detail.description_en ?? "",
      fa: detail.description_fa ?? "",
      ar: detail.description_ar ?? "",
    })
    setCaseStudy(caseStudyToForm(detail.case_study_raw))
    setCategoryId(project.category ? String(project.category.id) : "none")
    setTechIds((project.technologies ?? []).map((tech) => tech.id))
    setClient(project.client ?? "")
    setLocation(project.location ?? "")
    setLiveUrl(project.live_url ?? "")
    setStartDate(project.start_date ? project.start_date.slice(0, 10) : "")
    setEndDate(project.end_date ? project.end_date.slice(0, 10) : "")
    setCoverId(detail.cover_image?.id ?? null)
    setCoverPreview(resolveMediaUrl(detail.cover_image?.file) ?? null)
    setOgId(detail.og_image?.id ?? null)
    setOgPreview(resolveMediaUrl(detail.og_image?.file) ?? null)
    setMetaTitle(detail.meta_title ?? "")
    setMetaDescription(detail.meta_description ?? "")
    setCanonicalUrl(detail.canonical_url ?? "")
    setStatus(project.status)
    setIsFeatured(project.is_featured)
    setIsPublic(project.is_public)
    setDirty(false)
  }, [project])

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
    (nextStatus: ProjectStatus) => ({
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
      category: categoryId === "none" ? null : Number(categoryId),
      technologies: techIds,
      client,
      location,
      live_url: liveUrl,
      start_date: startDate || null,
      end_date: endDate || null,
      cover_image: coverId,
      og_image: ogId,
      case_study: formToCaseStudy(caseStudy),
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      canonical_url: canonicalUrl || undefined,
      status: nextStatus,
      is_featured: isFeatured,
      is_public: isPublic,
    }),
    [titles, excerpts, bodies, slug, categoryId, techIds, client, location, liveUrl,
      startDate, endDate, coverId, ogId, caseStudy, metaTitle, metaDescription, canonicalUrl, isFeatured, isPublic],
  )

  const persist = useCallback(
    (nextStatus: ProjectStatus, opts: { silent?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        if (!opts.silent) {
          setError(null)
          setFieldErrors({})
        }
        const onError = (e: unknown) => {
          const apiError = toApiError(e)
          if (!opts.silent) {
            setError(apiError.message || t("projectWorkspace.saveFailed"))
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
            titles, excerpts, bodies, slug, categoryId, techIds, client, location, liveUrl,
            startDate, endDate, coverId, ogId, caseStudy, hiddenSections,
            metaTitle, metaDescription, canonicalUrl, status: nextStatus, isFeatured, isPublic,
          })
          setSavedAt(new Date().toISOString())
          setDirty(false)
          if (!opts.silent) setStatus(nextStatus)
          resolve(true)
        }
        if (isNew) {
          create.mutate(buildPayload(nextStatus), { onSuccess, onError })
        } else if (projectId != null) {
          update.mutate(buildPayload(nextStatus), { onSuccess, onError })
        } else {
          resolve(false)
        }
      }),
    [projectId, buildPayload, create, isNew, t, update,
      titles, excerpts, bodies, slug, categoryId, techIds, client, location, liveUrl,
      startDate, endDate, coverId, ogId, caseStudy, hiddenSections,
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
    if (ok) navigate("/dashboard/projects")
  }

  const handleSubmitReview = async () => {
    const ok = await persist("review")
    if (!ok || projectId == null) return
    try {
      if (!workflowsQuery.data?.length) {
        const created = await ensureWorkflow.mutateAsync(undefined)
        navigate(`/dashboard/editorial/${created.id}`)
        return
      }
      await submitReview.mutateAsync({ comment: t("projectWorkspace.submitComment") })
      navigate(`/dashboard/editorial/${workflowId}`)
    } catch (e) {
      setError(toApiError(e).message || t("projectWorkspace.saveFailed"))
    }
  }

  const openPicker = (mode: "cover" | "og" | "gallery" | "body") => {
    setPickerMode(mode)
    setPickerOpen(true)
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
    } else if (pickerMode === "gallery") {
      if (projectId != null) {
        addGallery.mutate({ image: media.id, sort_order: galleryQuery.data?.length ?? 0 })
      }
    } else {
      setImageSignal({ url, alt: media.alt_text_en || media.title_en || media.original_name, nonce: Date.now() })
    }
  }

  const moveGalleryRow = (index: number, delta: -1 | 1) => {
    const rows = galleryQuery.data ?? []
    const next = index + delta
    if (next < 0 || next >= rows.length || projectId == null) return
    const order = rows.map((row) => row.id)
    const [moved] = order.splice(index, 1)
    order.splice(next, 0, moved)
    reorderGallery.mutate(order)
  }

  const rawCaseStudy = useMemo(() => formToCaseStudy(caseStudy), [caseStudy])

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
      items.push({ key: "slug", severity: "critical", message: t("studio.health.missingSlug"), target: "project-slug" })
    }
    for (const locale of CASE_STUDY_LOCALES) {
      const name = locale.toUpperCase()
      if (!titles[locale].trim()) {
        items.push({
          key: `title-${locale}`, severity: "critical",
          message: t("studio.health.missingTitle", { locale: name }),
          target: "project-title", locale,
        })
      }
      if (!excerpts[locale].trim()) {
        items.push({
          key: `excerpt-${locale}`, severity: "warning",
          message: t("studio.health.missingSummary", { locale: name }),
          target: "project-excerpt", locale,
        })
      }
      if (editorStatsFor(bodies[locale]).words < 50) {
        items.push({
          key: `body-${locale}`, severity: "warning",
          message: t("studio.health.thinBody", { locale: name }),
          target: "project-body", locale,
        })
      }
    }
    if (coverId == null) {
      items.push({ key: "cover", severity: "warning", message: t("studio.health.missingCover"), target: "project-cover" })
    }
    if (!client.trim() && !location.trim()) {
      items.push({ key: "meta", severity: "warning", message: t("studio.health.missingProjectMeta"), target: "project-client" })
    }
    if (!caseStudyHasText(rawCaseStudy)) {
      items.push({ key: "case", severity: "warning", message: t("studio.health.emptyCaseStudy"), target: "cs-challenge" })
    } else {
      if (!leafHasText(rawCaseStudy?.challenge)) {
        items.push({ key: "case-challenge", severity: "warning", message: t("studio.health.emptyCaseSection", { section: t("studio.caseStudy.challenge") }), target: "cs-challenge" })
      }
      if (!leafHasText(rawCaseStudy?.solution_approach)) {
        items.push({ key: "case-solution", severity: "warning", message: t("studio.health.emptyCaseSection", { section: t("studio.caseStudy.solution") }), target: "cs-solution" })
      }
      if (!leafHasText(rawCaseStudy?.results)) {
        items.push({ key: "case-results", severity: "warning", message: t("studio.health.emptyCaseSection", { section: t("studio.caseStudy.results") }), target: "cs-results" })
      }
    }
    for (const [key] of Object.entries(hiddenSections).filter(([, v]) => v)) {
      items.push({ key: `hidden-${key}`, severity: "warning", message: t("studio.health.hiddenSection", { section: key }), target: "cs-challenge" })
    }
    const galleryRows = galleryQuery.data ?? []
    if (galleryRows.length === 0) {
      items.push({ key: "gallery", severity: "warning", message: t("studio.health.emptyGallery"), target: "project-gallery" })
    } else if (galleryRows.some((row) => !row.alt_text_en && !row.alt_text_fa && !row.alt_text_ar)) {
      items.push({ key: "gallery-alt", severity: "warning", message: t("studio.health.galleryMissingAlt"), target: "project-gallery" })
    }
    return items
  }, [slug, titles, excerpts, bodies, coverId, client, location, rawCaseStudy, hiddenSections, galleryQuery.data, t])

  const healthStats = useMemo(() => {
    const words =
      editorStatsFor(bodies.en).words + editorStatsFor(bodies.fa).words + editorStatsFor(bodies.ar).words
    const headings = [bodies.en, bodies.fa, bodies.ar].join(" ").match(/<h[1-6][^>]*>/gi)?.length ?? 0
    return [
      { label: t("articleEditor.totalWords"), value: words },
      { label: t("articleEditor.headings"), value: headings },
      { label: t("studio.health.stages", { defaultValue: "Stages" }), value: caseStudy.stages.length },
      { label: t("studio.health.nodes", { defaultValue: "Architecture nodes" }), value: caseStudy.archNodes.length },
    ]
  }, [bodies, caseStudy, t])

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
        { title: "project-meta-title", description: "project-meta-description", slug: "project-slug", canonical: "project-canonical", og: "project-og" },
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
      <PageWrapper title={t("projectWorkspace.form.editTitle")}>
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-10" />
          <Skeleton className="h-64" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || (!isNew && !project)) {
    return (
      <PageWrapper title={t("projectWorkspace.form.editTitle")}>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t("projectWorkspace.loadFailed")}</CardContent>
          <CardContent className="flex gap-2 px-6 pb-6">
            <Button variant="outline" onClick={() => void refetch()}>{t("errors.retry")}</Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard/projects">{t("common.back")}</Link>
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={isNew ? t("projectWorkspace.form.createTitle") : t("projectWorkspace.form.editTitle")}
      description={t("projectWorkspace.form.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("projectWorkspace.title"), href: "/dashboard/projects" },
        { label: isNew ? t("projectWorkspace.form.createTitle") : (project?.slug ?? "") },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StudioLocaleSelect value={editingLocale} onChange={setEditingLocale} completeness={completeness} id="project-locale" />
          {savedAt ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status">
              <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
              {dirty ? t("projectWorkspace.unsavedChanges") : t("projectWorkspace.savedAt", { time: new Date(savedAt).toLocaleTimeString() })}
            </span>
          ) : dirty ? (
            <Badge variant="outline">{t("projectWorkspace.unsavedChanges")}</Badge>
          ) : null}
          {!isNew && projectId != null ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/projects/${projectId}/preview`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                {t("projectWorkspace.preview")}
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
              <CardTitle className="text-base">{t("projectWorkspace.form.identity")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="project-title">
                  {editingLocale === "fa"
                    ? t("projectWorkspace.form.titleFa")
                    : editingLocale === "ar"
                      ? t("projectWorkspace.form.titleAr")
                      : t("projectWorkspace.form.titleEn")}
                </Label>
                <Input
                  id="project-title"
                  value={titles[editingLocale]}
                  onChange={(e) => setTitles((prev) => ({ ...prev, [editingLocale]: e.target.value }))}
                  dir="auto"
                />
                <FieldError name={`title_${editingLocale}`} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-slug">{t("projectWorkspace.form.slug")}</Label>
                <Input
                  id="project-slug"
                  value={slug}
                  dir="ltr"
                  placeholder="my-project-slug"
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(e.target.value)
                  }}
                />
                <FieldError name="slug" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-client">{t("projectWorkspace.form.client")}</Label>
                <Input id="project-client" value={client} onChange={(e) => setClient(e.target.value)} dir="auto" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-location">{t("projectWorkspace.form.location")}</Label>
                <Input id="project-location" value={location} onChange={(e) => setLocation(e.target.value)} dir="auto" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-start">{t("projectWorkspace.form.startDate")}</Label>
                <Input id="project-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-end">{t("projectWorkspace.form.endDate")}</Label>
                <Input id="project-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="project-url">{t("projectWorkspace.form.liveUrl")}</Label>
                <Input id="project-url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://" dir="ltr" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("projectWorkspace.form.content")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="project-excerpt">{t("projectWorkspace.excerptEn")}</Label>
                <Textarea
                  id="project-excerpt"
                  rows={2}
                  value={excerpts[editingLocale]}
                  onChange={(e) => setExcerpts((prev) => ({ ...prev, [editingLocale]: e.target.value }))}
                  dir="auto"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="project-body">{t("projectWorkspace.form.descriptionEn")}</Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t("projectWorkspace.wordCount", { count: editorStatsFor(bodies[editingLocale]).words })}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openPicker("body")}>
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("projectWorkspace.insertImage")}
                    </Button>
                  </div>
                </div>
                <RichTextEditor
                  id="project-body"
                  label={t("projectWorkspace.form.descriptionEn")}
                  value={bodies[editingLocale]}
                  onChange={(value) => setBodies((prev) => ({ ...prev, [editingLocale]: value }))}
                  dir={localeDir}
                  placeholder={t("projectWorkspace.form.descriptionEn")}
                  disabled={pending}
                  onInsertImage={() => openPicker("body")}
                  externalImageSignal={imageSignal}
                />
                <FieldError name={`description_${editingLocale}`} />
              </div>
            </CardContent>
          </Card>

          <div aria-label={t("studio.caseStudy.title")}>
            <CaseStudyEditor
              form={caseStudy}
              onChange={setCaseStudy}
              locale={editingLocale}
              hidden={hiddenSections}
              onToggleHidden={(key) => setHiddenSections((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("projectWorkspace.form.details")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t("projectWorkspace.form.technologies")}</Label>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {(technologiesQuery.data ?? []).map((tech) => (
                    <label key={tech.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-accent">
                      <Checkbox
                        checked={techIds.includes(tech.id)}
                        onCheckedChange={(checked) =>
                          setTechIds((prev) => (checked ? [...prev, tech.id] : prev.filter((id) => id !== tech.id)))
                        }
                      />
                      <span dir="auto">{language === "fa" ? (tech.title_fa || tech.title_en) : tech.title_en}</span>
                    </label>
                  ))}
                </div>
                {technologiesQuery.data?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("projectWorkspace.noTechnologies")}</p>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="project-meta-title">{t("projectWorkspace.metaTitle")}</Label>
                  <Input id="project-meta-title" value={metaTitle} maxLength={70} onChange={(e) => setMetaTitle(e.target.value)} dir="auto" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-meta-description">{t("projectWorkspace.metaDescription")}</Label>
                  <Textarea id="project-meta-description" rows={2} value={metaDescription} maxLength={160} onChange={(e) => setMetaDescription(e.target.value)} dir="auto" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="project-canonical">Canonical URL</Label>
                  <Input id="project-canonical" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} dir="ltr" placeholder="https://" />
                  <FieldError name="canonical_url" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <OgImageField
                    id="project-og"
                    preview={ogPreview ?? coverPreview}
                    onChoose={() => openPicker("og")}
                    onRemove={() => { setOgId(null); setOgPreview(null) }}
                  />
                  <FieldError name="og_image" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t("projectWorkspace.gallery.title")}</CardTitle>
                {!isNew ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => openPicker("gallery")}>
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    {t("projectWorkspace.gallery.add")}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {isNew ? (
                <p className="text-sm text-muted-foreground">{t("projectWorkspace.gallery.saveFirst")}</p>
              ) : galleryQuery.isLoading ? (
                <div className="grid grid-cols-3 gap-2" role="status" aria-live="polite">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : (galleryQuery.data ?? []).length === 0 ? (
                <p id="project-gallery" className="text-sm text-muted-foreground">{t("projectWorkspace.gallery.empty")}</p>
              ) : (
                <ul id="project-gallery" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(galleryQuery.data ?? []).map((row, index) => (
                    <li key={row.id} className="group relative overflow-hidden rounded-xl border bg-muted/30">
                      <img
                        src={resolveMediaUrl(row.image_url) ?? row.image_url}
                        alt={localizedLeaf(
                          {
                            en: row.alt_text_en || undefined,
                            fa: row.alt_text_fa || undefined,
                            ar: row.alt_text_ar || undefined,
                          },
                          editingLocale,
                        ) || `Gallery image ${index + 1}`}
                        className="aspect-square h-full w-full object-cover"
                        loading="lazy"
                      />
                      {row.is_cover ? (
                        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                          <Star className="h-3 w-3" aria-hidden="true" />
                          {t("projectWorkspace.gallery.coverBadge")}
                        </span>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={index === 0 || reorderGallery.isPending}
                            onClick={() => moveGalleryRow(index, -1)}
                            aria-label={t("projectWorkspace.gallery.moveLeft")}
                          >
                            <ArrowUp className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={index === (galleryQuery.data ?? []).length - 1 || reorderGallery.isPending}
                            onClick={() => moveGalleryRow(index, 1)}
                            aria-label={t("projectWorkspace.gallery.moveRight")}
                          >
                            <ArrowDown className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={row.is_cover ? "default" : "secondary"}
                            onClick={() => patchGallery.mutate({ rowId: row.id, payload: { is_cover: !row.is_cover } })}
                            aria-label={t("projectWorkspace.gallery.toggleCover")}
                          >
                            <Star className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeGallery.mutate(row.id)}
                            aria-label={t("projectWorkspace.gallery.remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("projectWorkspace.form.publishing")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project-status">{t("projectWorkspace.form.status")}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
                  <SelectTrigger id="project-status">
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
                <p className="text-xs text-muted-foreground">{t("projectWorkspace.statusHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-category">{t("projectWorkspace.form.category")}</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="project-category">
                    <SelectValue placeholder={t("projectWorkspace.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("projectWorkspace.noCategory")}</SelectItem>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {language === "fa" ? (category.title_fa || category.title_en) : category.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isFeatured} onCheckedChange={(checked) => setIsFeatured(Boolean(checked))} />
                  {t("projectWorkspace.form.isFeatured")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
                  {t("projectWorkspace.form.isPublic")}
                </label>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground" aria-live="polite">
                {t("projectWorkspace.wordCount", {
                  count:
                    editorStatsFor(bodies.en).words +
                    editorStatsFor(bodies.fa).words +
                    editorStatsFor(bodies.ar).words,
                })}
                {project?.updated_at ? (
                  <>
                    {" · "}
                    {t("projectWorkspace.lastUpdated", { time: new Date(project.updated_at).toLocaleString() })}
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t("projectWorkspace.coverTitle")}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => openPicker("cover")}>
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  {t("projectWorkspace.chooseCover")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coverPreview ? (
                <div id="project-cover" className="overflow-hidden rounded-xl border">
                  <img src={coverPreview} alt={titles[editingLocale] || slug} className="aspect-[16/10] h-full w-full object-cover" loading="lazy" />
                </div>
              ) : (
                <p id="project-cover" className="text-sm text-muted-foreground">{t("projectWorkspace.noCover")}</p>
              )}
              {coverId != null ? (
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setCoverId(null); setCoverPreview(null) }}>
                  {t("projectWorkspace.removeCover")}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <ContentHealthPanel items={[...healthItems, ...seoItems]} stats={healthStats} onNavigate={handleHealthNavigate} />

          <SeoPreviewCard
            title={metaTitle || titles[editingLocale] || slug}
            description={metaDescription || excerpts[editingLocale]}
            url={typeof window !== "undefined" ? `${window.location.origin}/projects/${slug}` : `/projects/${slug}`}
            robots="index,follow"
            locale={editingLocale}
            image={ogPreview ?? coverPreview}
          />

          {!isNew && projectId != null ? (
            <PublicationPanel
              status={status}
              workflowStage={workflowDetail.data?.stage.code ?? workflowsQuery.data?.[0]?.stage.code ?? "draft"}
              scheduledFor={workflowDetail.data?.schedules.find((s) => s.status === "scheduled")?.scheduled_for ?? null}
              publishedAt={project?.published_at ?? null}
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
              {isNew ? t("projectWorkspace.createDraft") : t("common.save")}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard/projects">{t("common.cancel")}</Link>
            </Button>
          </div>
        </aside>
      </div>

      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={handlePickMedia} title={t("projectWorkspace.mediaTitle")} />
    </PageWrapper>
  )
}
