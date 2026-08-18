import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useStaffArticle, useCreateStaffArticle, useUpdateStaffArticle } from "../hooks/staff"
import type { ArticleStatus } from "../api/staff"

const STATUS_OPTIONS: Array<{ value: ArticleStatus; label: string }> = [
  { value: "draft", label: "articleWorkspace.statusDraft" },
  { value: "review", label: "articleWorkspace.statusReview" },
  { value: "published", label: "articleWorkspace.statusPublished" },
  { value: "archived", label: "articleWorkspace.statusArchived" },
]

/** Create/edit an article draft through the existing CMS API (Part I).
 * Publishing transitions should run through the editorial workflow — this form
 * only stores drafts and safe metadata updates. */
export function ArticleEditPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id
  const articleId = id ? Number(id) : undefined

  const { data: article, isLoading } = useStaffArticle(isNew ? undefined : articleId)
  const create = useCreateStaffArticle()
  const update = useUpdateStaffArticle(isNew ? undefined : articleId)

  const [titleEn, setTitleEn] = useState("")
  const [titleFa, setTitleFa] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [slug, setSlug] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")
  const [descriptionFa, setDescriptionFa] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [status, setStatus] = useState<ArticleStatus>("draft")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hydrate once when the server article arrives.
  useEffect(() => {
    if (!article) return
    setTitleEn(article.title_en ?? "")
    setTitleFa(article.title_fa ?? "")
    setTitleAr(article.title_ar ?? "")
    setSlug(article.slug ?? "")
    setDescriptionEn((article as { description_en?: string }).description_en ?? "")
    setDescriptionFa((article as { description_fa?: string }).description_fa ?? "")
    setDescriptionAr((article as { description_ar?: string }).description_ar ?? "")
    setStatus(article.status)
    setIsFeatured(article.is_featured)
    setIsPublic(article.is_public)
  }, [article])

  const handleSave = () => {
    setError(null)
    const payload = {
      title_en: titleEn,
      title_fa: titleFa,
      title_ar: titleAr,
      slug,
      short_description_en: (article as { short_description_en?: string } | undefined)?.short_description_en ?? "",
      description_en: descriptionEn,
      description_fa: descriptionFa,
      description_ar: descriptionAr,
      status,
      is_featured: isFeatured,
      is_public: isPublic,
    }
    const onError = (e: unknown) => {
      const message = (e as { message?: string })?.message ?? t("common.error")
      setError(message)
    }
    if (isNew) {
      create.mutate(payload, {
        onSuccess: () => navigate("/dashboard/articles"),
        onError,
      })
    } else if (articleId != null) {
      update.mutate(payload, {
        onSuccess: () => navigate("/dashboard/articles"),
        onError,
      })
    }
  }

  if (isLoading) return <PageWrapper title={t("articleWorkspace.form.editTitle")}><Skeleton className="h-24" /></PageWrapper>

  return (
    <PageWrapper
      title={isNew ? t("articleWorkspace.form.createTitle") : t("articleWorkspace.form.editTitle")}
      description={t("articleWorkspace.form.subtitle")}
    >
      <div className="mx-auto max-w-3xl space-y-4">
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
              <Label>{t("articleWorkspace.form.titleEn")}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.titleFa")}</Label>
              <Input value={titleFa} onChange={(e) => setTitleFa(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.titleAr")}</Label>
              <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.slug")}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-article-slug" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("articleWorkspace.form.content")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.descriptionEn")}</Label>
              <Textarea rows={8} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.descriptionFa")}</Label>
              <Textarea rows={6} value={descriptionFa} onChange={(e) => setDescriptionFa(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.descriptionAr")}</Label>
              <Textarea rows={6} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("articleWorkspace.form.publishing")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("articleWorkspace.form.status")}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ArticleStatus)}>
                <SelectTrigger>
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
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard/articles")}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
            {isNew ? t("articleWorkspace.createDraft") : t("common.save")}
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}