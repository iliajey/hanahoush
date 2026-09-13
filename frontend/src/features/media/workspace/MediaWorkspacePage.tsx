import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Eye, FileText, Image as ImageIcon, LayoutGrid, Link2, List, Search, Trash2, Upload, Pencil } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useDebounce } from "@/shared/hooks"
import { resolveMediaFile } from "@/shared/lib"

import { useDeleteMedia, useMediaList, useUpdateMediaMetadata, useUploadMedia } from "../hooks"
import type { MediaFile, MediaMetadata } from "../types"
import { formatMediaSize } from "../types"

type MediaFilter = "all" | "images" | "documents"

const PAGE_SIZE = 24
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

function MediaThumb({ media, className }: { media: MediaFile; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = resolveMediaFile(media)
  if (!src || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center text-muted-foreground" role="img" aria-label={media.original_name}>
        <FileText className="h-8 w-8" aria-hidden="true" />
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={media.alt_text_en || media.title_en || media.original_name}
      className={className ?? "h-full w-full object-cover"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function MediaActions({
  media,
  onPreview,
  onEdit,
  onDelete,
  onCopy,
  copied,
}: {
  media: MediaFile
  onPreview: (media: MediaFile) => void
  onEdit: (media: MediaFile) => void
  onDelete: (media: MediaFile) => void
  onCopy: (media: MediaFile) => void
  copied: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => onPreview(media)} title={t("mediaWorkspace.previewTitle")}>
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t("mediaWorkspace.previewTitle")}</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onCopy(media)} title={t("mediaWorkspace.copyUrl")}>
        {copied ? <Check className="h-4 w-4 text-green-600" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        <span className="sr-only">{t("mediaWorkspace.copyUrl")}</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onEdit(media)} title={t("mediaWorkspace.editMeta")}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t("mediaWorkspace.editMeta")}</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(media)} title={t("mediaWorkspace.deleteFile")}>
        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        <span className="sr-only">{t("mediaWorkspace.deleteFile")}</span>
      </Button>
    </div>
  )
}

function MediaCard({
  media,
  onPreview,
  onEdit,
  onDelete,
  onCopy,
  copied,
}: {
  media: MediaFile
  onPreview: (media: MediaFile) => void
  onEdit: (media: MediaFile) => void
  onDelete: (media: MediaFile) => void
  onCopy: (media: MediaFile) => void
  copied: boolean
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="p-3">
        <button
          type="button"
          onClick={() => onPreview(media)}
          className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${t("mediaWorkspace.previewTitle")}: ${media.title_en || media.original_name}`}
        >
          <MediaThumb media={media} />
        </button>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" dir="auto">{media.title_en || media.original_name}</p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {formatMediaSize(media.size)} · {media.uploader}
            </p>
            {media.width && media.height ? (
              <p className="text-xs text-muted-foreground" dir="ltr">
                {media.width}×{media.height}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="outline">{t("mediaWorkspace.referenceCount", { count: media.reference_count })}</Badge>
              {media.mime_type?.startsWith("image/") ? (
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              ) : null}
              {!media.alt_text_en && media.mime_type?.startsWith("image/") ? (
                <Badge variant="secondary">{t("mediaWorkspace.missingAlt")}</Badge>
              ) : null}
            </div>
          </div>
          <MediaActions media={media} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy} copied={copied} />
        </div>
      </CardContent>
    </Card>
  )
}

function MediaRow({
  media,
  onPreview,
  onEdit,
  onDelete,
  onCopy,
  copied,
}: {
  media: MediaFile
  onPreview: (media: MediaFile) => void
  onEdit: (media: MediaFile) => void
  onDelete: (media: MediaFile) => void
  onCopy: (media: MediaFile) => void
  copied: boolean
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => onPreview(media)}
          className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${t("mediaWorkspace.previewTitle")}: ${media.title_en || media.original_name}`}
        >
          <MediaThumb media={media} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" dir="auto">{media.title_en || media.original_name}</p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            {media.mime_type} · {formatMediaSize(media.size)}
            {media.width && media.height ? ` · ${media.width}×${media.height}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="outline">{t("mediaWorkspace.referenceCount", { count: media.reference_count })}</Badge>
            {!media.alt_text_en && media.mime_type?.startsWith("image/") ? (
              <Badge variant="secondary">{t("mediaWorkspace.missingAlt")}</Badge>
            ) : null}
          </div>
        </div>
        <MediaActions media={media} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy} copied={copied} />
      </CardContent>
    </Card>
  )
}

export function MediaWorkspacePage() {
  const { t } = useTranslation()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<MediaFilter>("all")
  const [ordering, setOrdering] = useState("-created_at")
  const [page, setPage] = useState(1)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [titleEn, setTitleEn] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  const [editing, setEditing] = useState<MediaFile | null>(null)
  const [editTitleEn, setEditTitleEn] = useState("")
  const [editTitleFa, setEditTitleFa] = useState("")
  const [editAltEn, setEditAltEn] = useState("")
  const [editAltFa, setEditAltFa] = useState("")
  const [editCaptionEn, setEditCaptionEn] = useState("")
  const [editCaptionFa, setEditCaptionFa] = useState("")
  const [editIsPublic, setEditIsPublic] = useState(true)

  const [deleting, setDeleting] = useState<MediaFile | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [preview, setPreview] = useState<MediaFile | null>(null)

  const upload = useUploadMedia()
  const remove = useDeleteMedia()
  const update = useUpdateMediaMetadata()

  const debouncedQ = useDebounce(q.trim(), 350)
  const params = useMemo(
    () => ({
      q: debouncedQ || undefined,
      is_image: filter === "images" ? true : filter === "documents" ? false : undefined,
      ordering,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedQ, filter, ordering, page],
  )
  const { data, isLoading, isError, refetch } = useMediaList(params)
  const totalPages = data?.pagination?.num_pages ?? 0

  const resetPage = () => setPage(1)

  const openEdit = (media: MediaFile) => {
    setEditing(media)
    setEditTitleEn(media.title_en)
    setEditTitleFa(media.title_fa)
    setEditAltEn(media.alt_text_en)
    setEditAltFa(media.alt_text_fa)
    setEditCaptionEn(media.caption_en)
    setEditCaptionFa(media.caption_fa)
    setEditIsPublic(media.is_public)
  }

  const saveEdit = () => {
    if (!editing) return
    const metadata: MediaMetadata = {
      title_en: editTitleEn,
      title_fa: editTitleFa,
      alt_text_en: editAltEn,
      alt_text_fa: editAltFa,
      caption_en: editCaptionEn,
      caption_fa: editCaptionFa,
      is_public: editIsPublic,
    }
    update.mutate({ id: editing.id, metadata }, { onSettled: () => setEditing(null) })
  }

  const copyUrl = async (media: MediaFile) => {
    const url = resolveMediaFile(media) ?? media.preview_url ?? media.file
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(media.id)
      window.setTimeout(() => setCopiedId((current) => (current === media.id ? null : current)), 2000)
    } catch {
      setCopiedId(null)
    }
  }

  const pickFile = (next: File | null) => {
    setFileError(null)
    if (next && next.size > MAX_UPLOAD_BYTES) {
      setFile(null)
      setFileError(t("mediaWorkspace.fileTooLarge"))
      return
    }
    setFile(next)
  }

  const handleUpload = () => {
    if (!file) return
    setFileError(null)
    setUploadPercent(0)
    upload.mutate(
      {
        file,
        metadata: { title_en: titleEn || file.name, is_public: isPublic },
        onProgress: (percent) => setUploadPercent(percent),
      },
      {
        onSuccess: (result) => {
          if (result.ok) {
            setUploadOpen(false)
            setFile(null)
            setTitleEn("")
            setUploadPercent(0)
          } else {
            setFileError(result.message || t("mediaWorkspace.uploadFailed"))
          }
        },
        onError: (error) => setFileError(error.message || t("mediaWorkspace.uploadFailed")),
      },
    )
  }

  return (
    <PageWrapper
      title={t("mediaWorkspace.title")}
      description={t("mediaWorkspace.subtitle")}
      breadcrumb={[
        { label: t("navWorkspace.dashboard"), href: "/dashboard" },
        { label: t("mediaWorkspace.title") },
      ]}
      actions={
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t("mediaWorkspace.upload")}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => {
              setQ(event.target.value)
              resetPage()
            }}
            placeholder={t("mediaWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("mediaWorkspace.searchPlaceholder")}
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as MediaFilter)
            resetPage()
          }}
        >
          <TabsList>
            <TabsTrigger value="all">{t("mediaWorkspace.allTypes")}</TabsTrigger>
            <TabsTrigger value="images">{t("mediaWorkspace.images")}</TabsTrigger>
            <TabsTrigger value="documents">{t("mediaWorkspace.documents")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={ordering} onValueChange={(value) => { setOrdering(value); resetPage() }}>
          <SelectTrigger className="w-full sm:w-48" aria-label={t("mediaWorkspace.sortLabel")}>
            <SelectValue placeholder={t("mediaWorkspace.sortLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">{t("mediaWorkspace.sortNewest")}</SelectItem>
            <SelectItem value="created_at">{t("mediaWorkspace.sortOldest")}</SelectItem>
            <SelectItem value="-size">{t("mediaWorkspace.sortLargest")}</SelectItem>
            <SelectItem value="original_name">{t("mediaWorkspace.sortName")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-md border" role="group" aria-label={t("mediaWorkspace.sortLabel")}>
          <Button
            type="button"
            size="sm"
            variant={view === "grid" ? "default" : "ghost"}
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            title={t("mediaWorkspace.viewGrid")}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("mediaWorkspace.viewGrid")}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "list" ? "default" : "ghost"}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            title={t("mediaWorkspace.viewList")}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("mediaWorkspace.viewList")}</span>
          </Button>
        </div>
        {data?.pagination ? (
          <span className="ms-auto text-xs text-muted-foreground" aria-live="polite">
            {t("mediaWorkspace.totalCount", { count: data.pagination.count })}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-live="polite">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title={t("mediaWorkspace.errorTitle")}
          description={t("mediaWorkspace.errorDescription")}
          onRetry={() => void refetch()}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title={t("mediaWorkspace.empty")}
          description={t("mediaWorkspace.emptyDescription")}
          action={
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t("mediaWorkspace.upload")}
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((media) => (
            <MediaCard
              key={media.id}
              media={media}
              onPreview={setPreview}
              onEdit={openEdit}
              onDelete={setDeleting}
              onCopy={copyUrl}
              copied={copiedId === media.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.items.map((media) => (
            <MediaRow
              key={media.id}
              media={media}
              onPreview={setPreview}
              onEdit={openEdit}
              onDelete={setDeleting}
              onCopy={copyUrl}
              copied={copiedId === media.id}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination
          className="mt-4"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(next) => setPage(Math.min(Math.max(1, next), totalPages))}
        />
      ) : null}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.uploadDialogTitle")}</DialogTitle>
            <DialogDescription>{t("mediaWorkspace.uploadDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:bg-accent">
              <Upload className="h-5 w-5" aria-hidden="true" />
              {file ? <span dir="ltr">{file.name}</span> : t("mediaWorkspace.selectFile")}
              <input
                type="file"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                aria-label={t("mediaWorkspace.selectFile")}
              />
            </label>
            {file ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={uploadPercent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-primary transition-all" style={{ width: `${uploadPercent}%` }} />
              </div>
            ) : null}
            {fileError ? <p role="alert" className="text-xs text-destructive">{fileError}</p> : null}
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.title")}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="auto" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
              {t("mediaWorkspace.form.isPublic")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpload} disabled={!file || upload.isPending}>
              {upload.isPending ? t("mediaWorkspace.uploading") : t("mediaWorkspace.upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing != null} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.metadataTitle")}</DialogTitle>
            <DialogDescription dir="ltr">{editing?.original_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.title")}</Label>
              <Input value={editTitleEn} onChange={(e) => setEditTitleEn(e.target.value)} dir="auto" />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.titleFa")}</Label>
              <Input value={editTitleFa} onChange={(e) => setEditTitleFa(e.target.value)} dir="auto" />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.alt")}</Label>
              <Input value={editAltEn} onChange={(e) => setEditAltEn(e.target.value)} dir="auto" />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.altFa")}</Label>
              <Input value={editAltFa} onChange={(e) => setEditAltFa(e.target.value)} dir="auto" />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.caption")}</Label>
              <Input value={editCaptionEn} onChange={(e) => setEditCaptionEn(e.target.value)} dir="auto" />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.captionFa")}</Label>
              <Input value={editCaptionFa} onChange={(e) => setEditCaptionFa(e.target.value)} dir="auto" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={editIsPublic} onCheckedChange={(checked) => setEditIsPublic(Boolean(checked))} />
              {t("mediaWorkspace.form.isPublic")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit} disabled={update.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting != null} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("mediaWorkspace.deleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          {deleting && deleting.reference_count > 0 ? (
            <p role="note" className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              {t("mediaWorkspace.referencedWarning", { count: deleting.reference_count })}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting) remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })
              }}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preview != null} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.previewTitle")}</DialogTitle>
            <DialogDescription dir="auto">{preview?.title_en || preview?.original_name}</DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="grid gap-3">
              <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                <MediaThumb media={preview} className="max-h-[50vh] w-full object-contain" />
              </div>
              <dl className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="flex justify-between gap-2"><dt>{t("mediaWorkspace.form.title")}</dt><dd dir="auto" className="font-medium text-foreground">{preview.title_en || preview.original_name}</dd></div>
                <div className="flex justify-between gap-2"><dt>Type</dt><dd dir="ltr">{preview.mime_type}</dd></div>
                <div className="flex justify-between gap-2"><dt>Size</dt><dd dir="ltr">{formatMediaSize(preview.size)}</dd></div>
                {preview.width && preview.height ? (
                  <div className="flex justify-between gap-2"><dt>Dimensions</dt><dd dir="ltr">{preview.width}×{preview.height}</dd></div>
                ) : null}
                <div className="flex justify-between gap-2"><dt>{t("mediaWorkspace.referenceCount", { count: preview.reference_count })}</dt><dd dir="ltr" className="tabular-nums">{preview.reference_count}</dd></div>
                <div className="flex justify-between gap-2"><dt>Alt</dt><dd dir="auto">{preview.alt_text_en || t("mediaWorkspace.missingAlt")}</dd></div>
              </dl>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPreview(null)}>{t("common.cancel")}</Button>
                <Button variant="outline" onClick={() => { if (preview) { setPreview(null); openEdit(preview) } }}>{t("mediaWorkspace.editMeta")}</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
