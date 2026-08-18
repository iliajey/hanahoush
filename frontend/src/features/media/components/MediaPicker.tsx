import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Image as ImageIcon, Loader2, Search, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/shared/lib/cn"

import { listMedia, uploadMedia, updateMedia } from "../api"
import { formatMediaSize, type MediaFile, type MediaMetadata } from "../types"
import { mediaAnalytics } from "../../analytics/domains"

/**
 * Reusable CMS media picker / uploader.
 *
 * - Staff-only: requires an authenticated admin session (JWT via the shared
 *   axios client).
 * - Searchable, paginated library grid with previews.
 * - Drag & drop upload with per-file progress and error surfacing.
 * - Inline localized metadata editing (alt / title / caption fa · en · ar).
 * - Safe soft-delete is available through the API; this picker focuses on
 *   browse / select / upload.
 */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Media library",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (media: MediaFile) => void
  title?: string
}) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<MediaFile[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await listMedia({ q: q || undefined, page: p, pageSize: 24 })
      setItems(result.items)
      setCount(result.pagination?.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the media library.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    mediaAnalytics.view()
    setPage(1)
    void load("", 1)
  }, [open, load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      void load(query, 1)
    }, 350)
    return () => clearTimeout(timer)
  }, [query, load])

  const doUpload = async (file: File) => {
    setUploading(true)
    setUploadPercent(0)
    setUploadError(null)
    const result = await uploadMedia(file, {}, (percent) => setUploadPercent(percent))
    setUploading(false)
    if (result.ok && result.media) {
      setItems((prev) => [result.media as MediaFile, ...prev])
      setCount((c) => c + 1)
    } else {
      setUploadError(result.message || "Upload failed — please try again.")
    }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void doUpload(file)
  }

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void doUpload(file)
    event.target.value = ""
  }

  const saveMetadata = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateMedia(selected.id, selected)
      setSelected(updated)
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / 24))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Browse, upload and select media for your content.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search media…"
                className="ps-9"
                aria-label="Search media"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload
            </Button>
            <input ref={inputRef} type="file" className="sr-only" onChange={onPickFile} aria-label="Upload file" />
          </div>

          {/* Drag & drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop a file to upload"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex min-h-20 items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center text-sm text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragOver && "border-brand-500 bg-brand-500/5",
            )}
          >
            {uploading ? (
              <div className="w-full max-w-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Spinner size="sm" />
                  Uploading… {uploadPercent}%
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
                Drop an image here, or click to browse
              </>
            )}
          </div>

          {uploadError ? (
            <p role="alert" className="text-sm text-destructive">
              {uploadError}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {/* Library grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No media found{query ? ` for “${query}”` : ""}. Upload something above.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((media) => {
                const isSelected = selected?.id === media.id
                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => {
                      setSelected(media)
                      mediaAnalytics.select(media.id)
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "border-brand-500 ring-2 ring-brand-500/40",
                    )}
                    aria-pressed={isSelected}
                    aria-label={media.alt_text_en || media.original_name}
                  >
                    {media.preview_url ? (
                      <img
                        src={media.preview_url}
                        alt={media.alt_text_en || media.original_name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                    )}
                    {isSelected ? (
                      <span className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          {count > 0 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {count} item{count === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const next = page - 1
                    setPage(next)
                    void load(query, next)
                  }}
                >
                  Previous
                </Button>
                <span>
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const next = page + 1
                    setPage(next)
                    void load(query, next)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}

          {/* Metadata editor */}
          {selected ? (
            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">{selected.original_name}</h4>
                <button
                  type="button"
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2"
                  onClick={() => setSelected(null)}
                  aria-label="Close metadata editor"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="media-alt-en">Alt text (EN)</Label>
                  <Input
                    id="media-alt-en"
                    value={selected.alt_text_en}
                    onChange={(e) => setSelected({ ...selected, alt_text_en: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="media-title-en">Title (EN)</Label>
                  <Input
                    id="media-title-en"
                    value={selected.title_en}
                    onChange={(e) => setSelected({ ...selected, title_en: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="media-alt-fa">متن جایگزین (FA)</Label>
                  <Input
                    id="media-alt-fa"
                    value={selected.alt_text_fa}
                    onChange={(e) => setSelected({ ...selected, alt_text_fa: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="media-alt-ar">النص البديل (AR)</Label>
                  <Input
                    id="media-alt-ar"
                    value={selected.alt_text_ar}
                    onChange={(e) => setSelected({ ...selected, alt_text_ar: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="media-caption-en">Caption (EN)</Label>
                  <Textarea
                    id="media-caption-en"
                    rows={2}
                    value={selected.caption_en}
                    onChange={(e) => setSelected({ ...selected, caption_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {selected.mime_type} · {formatMediaSize(selected.size)} · used {selected.reference_count}×
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={() => void saveMetadata()} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save metadata
                  </Button>
                  <Button type="button" size="sm" onClick={() => onSelect?.(selected)}>
                    Use this image
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type { MediaMetadata }