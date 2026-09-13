import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Check, Eye, ImagePlus, Loader2, Send, X } from "lucide-react"

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
import { useEnsureWorkflowMutation, useSubmitForReviewMutation, useWorkflowForContent } from "@/features/editorial/hooks"
import { MediaPicker } from "@/features/media/components/MediaPicker"
import type { MediaFile } from "@/features/media/types"
import { toApiError } from "@/shared/api/axiosClient"

import { useStaffArticle, useCreateStaffArticle, useUpdateStaffArticle } from "../hooks/staff"
import { useArticleCategories, useArticleTags } from "../hooks"
import type { ArticleStatus } from "../api/staff"
import { resolveMediaFile, resolveMediaUrl } from "@/shared/lib"
import { RichTextEditor, editorStatsFor } from "./RichTextEditor"
import type { StudioLocale } from "@/components/ui"

const STATUS_OPTIONS: Array<{ value: ArticleStatus; label: string }> = [
  { value: "draft", label: "articleWorkspace.statusDraft" },
  { value: "review", label: "articleWorkspace.statusReview" },
  { value: "published", label: "articleWorkspace.statusPublished" },
  { value: "archived", label: "articleWorkspace.statusArchived" },
]

const AUTOSAVE_DELAY_MS = 30000

type Trilingual = Record<StudioLocale, string>
const emptyTrilingual = (): Trilingual => ({ fa: "", en: "", ar: "" })

/** Article Studio 2.0 (Phase 15): single-locale editing workspace with a
 * dropdown language selector, tags editor, cover picker, actionable
 * content health, autosave + dirty guard, and the submit-for-review
 * workflow action. */
export function ArticleEditPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id
  const articleId = id ? Number(id) : undefined
  const { can } = useAuthorization()

  const { data: article, isLoading, isError, refetch } = useStaffArticle(isNew ? undefined : articleId)
  const create = useCreateStaffArticle()
  const update = useUpdateStaffArticle(isNew ? undefined : articleId)
  const categoriesQuery = useArticleCategories()
  const tagsQuery = useArticleTags()

  const [editingLocale, setEditingLocale] = useState<StudioLocale>(
    language === "fa" || language === "ar" ? language : "en",
  )
  const [titles, setTitles] = useState<Trilingual>(emptyTrilingual)
  const [excerpts, setExcerpts] = useState<Trilingual>(emptyTrilingual)
  const [bodies, setBodies] = useState<Trilingual>(emptyTrilingual)
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [categoryId, setCategoryId] = useState<string>("none")
  const [tagIds, setTagIds] = useState<number[]>([])
  const [coverId, setCoverId] = useState<number | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [status, setStatus] = useState<ArticleStatus>("draft")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<"cover" | "body">("cover")
  const [imageSignal, setImageSignal] = useState<{ url: string; alt: string; nonce: number } | null>(null)

  const hydratedFor = useRef<number | string | null>(null)
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  const snapshotRef = useRef("")

  const workflowsQuery = useWorkflowForContent("articles.article", articleId)
  const ensureWorkflow = useEnsureWorkflowMutation("articles.article", articleId ?? 0)
  const workflowId = workflowsQuery.data?.[0]?.id ?? 0
  const submitReview = useSubmitForReviewMutation(workflowId)
  const canSubmitReview = can(CAPABILITIES.EDITORIAL_MANAGE)

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        titles, excerpts, bodies, slug, categoryId, tagIds, coverId,
        metaTitle, metaDescription, status, isFeatured, isPublic,
      }),
    [titles, excerpts, bodies, slug, categoryId, tagIds, coverId,
      metaTitle, metaDescription, status, isFeatured, isPublic],
  )

  useEffect(() => {
    if (!article || hydratedFor.current === article.id) return
    hydratedFor.current = article.id
    const detail = article as typeof article & {
      description_en?: string
      description_fa?: string
      description_ar?: string
      meta_title?: string
      meta_description?: string
      cover_image?: { id: number; file: string } | null
    }
    setTitles({ en: article.title_en ?? "", fa: article.title_fa ?? "", ar: article.title_ar ?? "" })
    setSlug(article.slug ?? "")
    setSlugTouched(true)
    setExcerpts({
      en: article.short_description_en ?? "",
      fa: article.short_description_fa ?? "",
      ar: article.short_description_ar ?? "",
    })
    setBodies({
      en: detail.description_en ?? "",
      fa: detail.description_fa ?? "",
      ar: detail.description_ar ?? "",
    })
    setCategoryId(article.category ? String(article.category.id) : "none")
    setTagIds((article.tags ?? []).map((tag) => tag.id))
    setCoverId(detail.cover_image?.id ?? null)
    setCoverPreview(resolveMediaUrl(detail.cover_image?.file) ?? null)
    setMetaTitle(detail.meta_title ?? "")
    setMetaDescription(detail.meta_description ?? "")
    setStatus(article.status)
    setIsFeatured(article.is_featured)
    setIsPublic(article.is_public)
    setDirty(false)
  }, [article])

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
    (nextStatus: ArticleStatus) => ({
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
      tags: tagIds,
      cover_image: coverId,
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      status: nextStatus,
      is_featured: isFeatured,
      is_public: isPublic,
    }),
    [titles, excerpts, bodies, slug, categoryId, tagIds, coverId,
      metaTitle, metaDescription, isFeatured, isPublic],
  )

  const persist = useCallback(
    (nextStatus: ArticleStatus, opts: { silent?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        if (!opts.silent) {
          setError(null)
          setFieldErrors({})
        }
        const onError = (e: unknown) => {
          const apiError = toApiError(e)
          if (!opts.silent) {
            setError(apiError.message || t("articleEditor.saveFailed"))
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
            titles, excerpts, bodies, slug, categoryId, tagIds, coverId,
            metaTitle, metaDescription, status: nextStatus, isFeatured, isPublic,
          })
          setSavedAt(new Date().toISOString())
          setDirty(false)
          if (!opts.silent) setStatus(nextStatus)
          resolve(true)
        }
        if (isNew) {
          create.mutate(buildPayload(nextStatus), { onSuccess, onError })
        } else if (articleId != null) {
          update.mutate(buildPayload(nextStatus), { onSuccess, onError })
        } else {
          resolve(false)
        }
      }),
    [articleId, buildPayload, create, isNew, t, update,
      titles, excerpts, bodies, slug, categoryId, tagIds, coverId,
      metaTitle, metaDescription, isFeatured, isPublic],
  )

  const pending = create.isPending || update.isPending

  useEffect(() => {
    if (isNew || !dirty) return
    const timer = window.setTimeout(() => {
      if (dirtyRef.current) void persist(status, { silent: true })
    }, AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [snapshot, isNew, dirty, status, persist])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const handleManualSave = async () => {
    const ok = await persist(status)
    if (ok) navigate("/dashboard/articles")
  }

  const handleSubmitReview = async () => {
    const ok = await persist("review")
    if (!ok || articleId == null) return
    try {
      if (!workflowsQuery.data?.length) {
        const created = await ensureWorkflow.mutateAsync(undefined)
        navigate(`/dashboard/editorial/${created.id}`)
        return
      }
      await submitReview.mutateAsync({ comment: t("articleWorkspace.submitComment") })
      navigate(`/dashboard/editorial/${workflowId}`)
    } catch (e) {
      setError(toApiError(e).message || t("articleEditor.saveFailed"))
    }
  }

  const openPicker = (mode: "cover" | "body") => {
    setPickerMode(mode)
    setPickerOpen(true)
  }

  const handlePickMedia = (media: MediaFile) => {
    setPickerOpen(false)
    const url = resolveMediaFile(media) ?? ""
    if (pickerMode === "cover") {
      setCoverId(media.id)
      setCoverPreview(url || null)
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
      items.push({ key: "slug", severity: "critical", message: t("studio.health.missingSlug"), target: "article-slug" })
    }
    for (const locale of ["fa", "en", "ar"] as const) {
      const name = locale.toUpperCase()
      if (!titles[locale].trim()) {
        items.push({
          key: `title-${locale}`, severity: "critical",
          message: t("studio.health.missingTitle", { locale: name }),
          target: "article-title", locale,
        })
      }
      if (!excerpts[locale].trim()) {
        items.push({
          key: `excerpt-${locale}`, severity: "warning",
          message: t("studio.health.missingSummary", { locale: name }),
          target: "article-excerpt", locale,
        })
      }
      if (editorStatsFor(bodies[locale]).words < 50) {
        items.push({
          key: `body-${locale}`, severity: "warning",
          message: t("studio.health.thinBody", { locale: name }),
          target: "article-body", locale,
        })
      }
    }
    if (coverId == null) {
      items.push({ key: "cover", severity: "warning", message: t("studio.health.missingCover"), target: "article-cover" })
    }
    return items
  }, [slug, titles, excerpts, bodies, coverId, t])

  const healthStats = useMemo(() => {
    const words =
      editorStatsFor(bodies.en).words + editorStatsFor(bodies.fa).words + editorStatsFor(bodies.ar).words
    const readingMinutes = Math.max(1, Math.ceil(words / 200))
    const headings = [bodies.en, bodies.fa, bodies.ar].join(" ").match(/<h[1-6][^>]*>/gi)?.length ?? 0
    const images = [bodies.en, bodies.fa, bodies.ar].join(" ").match(/<img[^>]*>/gi)?.length ?? 0
    return [
      { label: t("articleEditor.totalWords"), value: words },
      { label: t("articleEditor.readingTime", { count: readingMinutes }), value: `${readingMinutes} min` },
      { label: t("articleEditor.headings"), value: headings },
      { label: t("articleEditor.bodyImages"), value: images },
    ]
  }, [bodies, t])

  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? <p className="text-xs text-destructive">{fieldErrors[name]}</p> : null

  const localeDir = editingLocale === "en" ? "ltr" : "rtl"

  const handleHealthNavigate = (item: HealthItem) => {
    if (item.locale) setEditingLocale(item.locale)
  }

  const titleLabel =
    editingLocale === "fa"
      ? t("articleWorkspace.form.titleFa")
      : editingLocale === "ar"
        ? t("articleWorkspace.form.titleAr")
        : t("articleWorkspace.form.titleEn")
  const excerptLabel =
    editingLocale === "fa"
      ? t("articleEditor.excerptFa")
      : editingLocale === "ar"
        ? t("articleEditor.excerptAr")
        : t("articleEditor.excerptEn")
  const bodyLabel =
    editingLocale === "fa"
      ? t("articleWorkspace.form.descriptionFa")
      : editingLocale === "ar"
        ? t("articleWorkspace.form.descriptionAr")
        : t("articleWorkspace.form.descriptionEn")

  if (isLoading) {
    return (
      <PageWrapper title={t("articleWorkspace.form.editTitle")}>
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-10" />
          <Skeleton className="h-64" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || (!isNew && !article)) {
    return (
      <PageWrapper title={t("articleWorkspace.form.editTitle")}>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t("articleEditor.loadFailed")}</CardContent>
          <CardContent className="flex gap-2 px-6 pb-6">
            <Button variant="outline" onClick={() => void refetch()}>{t("errors.retry")}</Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard/articles">{t("common.back")}</Link>
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={isNew ? t("articleWorkspace.form.createTitle") : t("articleWorkspace.form.editTitle")}
      description={t("articleWorkspace.form.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("articleWorkspace.title"), href: "/dashboard/articles" },
        { label: isNew ? t("articleWorkspace.form.createTitle") : (article?.slug ?? "") },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StudioLocaleSelect value={editingLocale} onChange={setEditingLocale} completeness={completeness} id="article-locale" />
          {savedAt ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status">
              <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
              {dirty ? t("articleEditor.unsavedChanges") : t("articleEditor.savedAt", { time: new Date(savedAt).toLocaleTimeString() })}
            </span>
          ) : dirty ? (
            <Badge variant="outline">{t("articleEditor.unsavedChanges")}</Badge>
          ) : null}
          {!isNew && articleId != null ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/articles/${articleId}/preview`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                {t("articleEditor.preview")}
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("articleWorkspace.form.identity")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="article-title">{titleLabel}</Label>
              <Input id="article-title" value={titles[editingLocale]} onChange={(e) => setTitles((prev) => ({ ...prev, [editingLocale]: e.target.value }))} dir="auto" />
              <FieldError name={`title_${editingLocale}`} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="article-slug">{t("articleWorkspace.form.slug")}</Label>
              <Input
                id="article-slug"
                value={slug}
                dir="ltr"
                placeholder="my-article-slug"
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
              />
              <FieldError name="slug" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="article-category">{t("articleEditor.category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="article-category">
                  <SelectValue placeholder={t("articleEditor.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("articleEditor.noCategory")}</SelectItem>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {language === "fa" ? (category.title_fa || category.title_en) : category.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="article-tags">{t("studio.article.tags")}</Label>
              <Select
                value="__pick"
                onValueChange={(value) => {
                  if (value === "__pick") return
                  const next = Number(value)
                  if (!tagIds.includes(next)) setTagIds((prev) => [...prev, next])
                }}
              >
                <SelectTrigger id="article-tags">
                  <SelectValue placeholder={t("studio.article.tagsPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__pick">{t("studio.article.tagsPlaceholder")}</SelectItem>
                  {(tagsQuery.data ?? [])
                    .filter((tag) => !tagIds.includes(tag.id))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={String(tag.id)}>
                        {language === "fa" ? (tag.title_fa || tag.title_en) : tag.title_en}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {tagIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5" aria-live="polite">
                  {tagIds.map((tagId) => {
                    const tag = (tagsQuery.data ?? []).find((row) => row.id === tagId)
                    return (
                      <Badge key={tagId} variant="secondary" className="gap-1">
                        {tag ? (language === "fa" ? (tag.title_fa || tag.title_en) : tag.title_en) : `#${tagId}`}
                        <button
                          type="button"
                          onClick={() => setTagIds((prev) => prev.filter((row) => row !== tagId))}
                          aria-label={t("studio.article.removeTag")}
                          className="rounded-full p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("studio.article.noTags")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{t("articleEditor.coverTitle")}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => openPicker("cover")}>
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {t("articleEditor.chooseCover")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {coverPreview ? (
              <div id="article-cover" className="overflow-hidden rounded-xl border">
                <img src={coverPreview} alt={titles[editingLocale] || slug} className="aspect-[21/9] h-full w-full object-cover" loading="lazy" />
              </div>
            ) : (
              <p id="article-cover" className="text-sm text-muted-foreground">{t("articleEditor.noCover")}</p>
            )}
            {coverId != null ? (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setCoverId(null); setCoverPreview(null) }}>
                {t("articleEditor.removeCover")}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("articleWorkspace.form.content")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="article-excerpt">{excerptLabel}</Label>
              <Textarea
                id="article-excerpt"
                rows={2}
                value={excerpts[editingLocale]}
                onChange={(e) => setExcerpts((prev) => ({ ...prev, [editingLocale]: e.target.value }))}
                dir="auto"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="article-body">{bodyLabel}</Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t("articleEditor.wordCount", { count: editorStatsFor(bodies[editingLocale]).words })}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => openPicker("body")}>
                    <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("articleEditor.insertImage")}
                  </Button>
                </div>
              </div>
              <RichTextEditor
                id="article-body"
                label={bodyLabel}
                value={bodies[editingLocale]}
                onChange={(value) => setBodies((prev) => ({ ...prev, [editingLocale]: value }))}
                dir={localeDir}
                placeholder={bodyLabel}
                disabled={pending}
                onInsertImage={() => openPicker("body")}
                externalImageSignal={imageSignal}
              />
              <FieldError name={`description_${editingLocale}`} />
            </div>
          </CardContent>
        </Card>

        <ContentHealthPanel
          items={healthItems}
          stats={healthStats}
          healthyLabel={t("articleEditor.healthGood")}
          onNavigate={handleHealthNavigate}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("articleWorkspace.form.publishing")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="article-status">{t("articleWorkspace.form.status")}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ArticleStatus)}>
                <SelectTrigger id="article-status">
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
              <p className="text-xs text-muted-foreground">{t("articleEditor.statusHint")}</p>
            </div>
            <div className="flex items-end gap-6 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={isFeatured} onCheckedChange={(checked) => setIsFeatured(Boolean(checked))} />
                {t("articleWorkspace.form.isFeatured")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
                {t("articleWorkspace.form.isPublic")}
              </label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="article-meta-title">{t("articleEditor.metaTitle")}</Label>
              <Input id="article-meta-title" value={metaTitle} maxLength={70} onChange={(e) => setMetaTitle(e.target.value)} dir="auto" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="article-meta-description">{t("articleEditor.metaDescription")}</Label>
              <Textarea id="article-meta-description" rows={2} value={metaDescription} maxLength={160} onChange={(e) => setMetaDescription(e.target.value)} dir="auto" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" asChild>
            <Link to="/dashboard/articles">{t("common.cancel")}</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {canSubmitReview && !isNew && articleId != null ? (
              <Button type="button" variant="outline" disabled={pending || ensureWorkflow.isPending || submitReview.isPending} onClick={() => void handleSubmitReview()}>
                {(ensureWorkflow.isPending || submitReview.isPending) ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                {t("articleWorkspace.submitForReview")}
              </Button>
            ) : null}
            <Button onClick={() => void handleManualSave()} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isNew ? t("articleWorkspace.createDraft") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>

      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={handlePickMedia} title={t("articleEditor.mediaTitle")} />
    </PageWrapper>
  )
}
