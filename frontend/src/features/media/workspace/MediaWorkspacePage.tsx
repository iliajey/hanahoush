import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FileText, Image as ImageIcon, Search, Trash2, Upload, Pencil } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

import { useDeleteMedia, useMediaList, useUpdateMediaMetadata, useUploadMedia } from "../hooks"
import type { MediaFile, MediaMetadata } from "../types"
import { formatMediaSize } from "../types"

type MediaFilter = "all" | "images" | "documents"

function MediaCard({
  media,
  onEdit,
  onDelete,
}: {
  media: MediaFile
  onEdit: (media: MediaFile) => void
  onDelete: (media: MediaFile) => void
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-md bg-muted">
          {media.preview_url ? (
            <img
              src={media.preview_url}
              alt={media.alt_text_en || media.title_en || media.original_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{media.title_en || media.original_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatMediaSize(media.size)} · {media.uploader}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="outline">{t("mediaWorkspace.referenceCount", { count: media.reference_count })}</Badge>
              {media.mime_type?.startsWith("image/") ? (
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(media)} title={t("mediaWorkspace.editMeta")}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t("mediaWorkspace.editMeta")}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(media)} title={t("mediaWorkspace.deleteFile")}>
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              <span className="sr-only">{t("mediaWorkspace.deleteFile")}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MediaWorkspacePage() {
  const { t } = useTranslation()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<MediaFilter>("all")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [titleEn, setTitleEn] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  const [editing, setEditing] = useState<MediaFile | null>(null)
  const [editTitleEn, setEditTitleEn] = useState("")
  const [editTitleFa, setEditTitleFa] = useState("")
  const [editAltEn, setEditAltEn] = useState("")
  const [editIsPublic, setEditIsPublic] = useState(true)

  const [deleting, setDeleting] = useState<MediaFile | null>(null)

  const upload = useUploadMedia()
  const remove = useDeleteMedia()
  const update = useUpdateMediaMetadata()

  const { data, isLoading, isError } = useMediaList({
    q: q || undefined,
    is_image: filter === "images" ? true : filter === "documents" ? false : undefined,
    pageSize: 48,
  })

  const openEdit = (media: MediaFile) => {
    setEditing(media)
    setEditTitleEn(media.title_en)
    setEditTitleFa(media.title_fa)
    setEditAltEn(media.alt_text_en)
    setEditIsPublic(media.is_public)
  }

  const saveEdit = () => {
    if (!editing) return
    const metadata: MediaMetadata = {
      title_en: editTitleEn,
      title_fa: editTitleFa,
      alt_text_en: editAltEn,
      is_public: editIsPublic,
    }
    update.mutate({ id: editing.id, metadata }, { onSettled: () => setEditing(null) })
  }

  const handleUpload = () => {
    if (!file) return
    upload.mutate(
      { file, metadata: { title_en: titleEn || file.name, is_public: isPublic } },
      {
        onSettled: () => {
          setUploadOpen(false)
          setFile(null)
          setTitleEn("")
        },
      },
    )
  }

  return (
    <PageWrapper title={t("mediaWorkspace.title")} description={t("mediaWorkspace.subtitle")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("mediaWorkspace.searchPlaceholder")}
            className="ps-9"
            aria-label={t("mediaWorkspace.searchPlaceholder")}
          />
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as MediaFilter)}>
          <TabsList>
            <TabsTrigger value="all">{t("mediaWorkspace.allTypes")}</TabsTrigger>
            <TabsTrigger value="images">{t("mediaWorkspace.images")}</TabsTrigger>
            <TabsTrigger value="documents">{t("mediaWorkspace.documents")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t("mediaWorkspace.upload")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : isError || !data?.items.length ? (
        <EmptyState title={t("mediaWorkspace.empty")} description={t("mediaWorkspace.emptyDescription")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((media) => (
            <MediaCard key={media.id} media={media} onEdit={openEdit} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.uploadDialogTitle")}</DialogTitle>
            <DialogDescription>{t("mediaWorkspace.uploadDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:bg-accent">
              <Upload className="h-5 w-5" aria-hidden="true" />
              {file ? file.name : t("mediaWorkspace.selectFile")}
              <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.title")}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
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

      {/* Edit metadata dialog */}
      <Dialog open={editing != null} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.metadataTitle")}</DialogTitle>
            <DialogDescription>{editing?.original_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.title")}</Label>
              <Input value={editTitleEn} onChange={(e) => setEditTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.titleFa")}</Label>
              <Input value={editTitleFa} onChange={(e) => setEditTitleFa(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("mediaWorkspace.form.alt")}</Label>
              <Input value={editAltEn} onChange={(e) => setEditAltEn(e.target.value)} />
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

      {/* Delete confirm */}
      <Dialog open={deleting != null} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mediaWorkspace.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("mediaWorkspace.deleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
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
    </PageWrapper>
  )
}