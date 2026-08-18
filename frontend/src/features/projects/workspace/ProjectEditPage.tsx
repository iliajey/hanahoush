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

import { useStaffProject, useCreateStaffProject, useUpdateStaffProject } from "../hooks/staff"
import type { ProjectStatus } from "../api/staff"

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "draft", label: "projectWorkspace.statusDraft" },
  { value: "review", label: "projectWorkspace.statusReview" },
  { value: "published", label: "projectWorkspace.statusPublished" },
  { value: "archived", label: "projectWorkspace.statusArchived" },
]

/** Create/edit a project through the existing project CMS API (Part J). */
export function ProjectEditPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id
  const projectId = id ? Number(id) : undefined

  const { data: project, isLoading } = useStaffProject(isNew ? undefined : projectId)
  const create = useCreateStaffProject()
  const update = useUpdateStaffProject(isNew ? undefined : projectId)

  const [titleEn, setTitleEn] = useState("")
  const [titleFa, setTitleFa] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [slug, setSlug] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")
  const [descriptionFa, setDescriptionFa] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [client, setClient] = useState("")
  const [location, setLocation] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("draft")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!project) return
    setTitleEn(project.title_en ?? "")
    setTitleFa(project.title_fa ?? "")
    setTitleAr(project.title_ar ?? "")
    setSlug(project.slug ?? "")
    setDescriptionEn((project as { description_en?: string }).description_en ?? "")
    setDescriptionFa((project as { description_fa?: string }).description_fa ?? "")
    setDescriptionAr((project as { description_ar?: string }).description_ar ?? "")
    setClient(project.client ?? "")
    setLocation(project.location ?? "")
    setLiveUrl(project.live_url ?? "")
    setStartDate(project.start_date ? project.start_date.slice(0, 10) : "")
    setEndDate(project.end_date ? project.end_date.slice(0, 10) : "")
    setStatus(project.status)
    setIsFeatured(project.is_featured)
    setIsPublic(project.is_public)
  }, [project])

  const handleSave = () => {
    setError(null)
    const payload = {
      title_en: titleEn,
      title_fa: titleFa,
      title_ar: titleAr,
      slug,
      description_en: descriptionEn,
      description_fa: descriptionFa,
      description_ar: descriptionAr,
      client,
      location,
      live_url: liveUrl,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
      is_featured: isFeatured,
      is_public: isPublic,
    }
    const onError = (e: unknown) => setError((e as { message?: string })?.message ?? t("common.error"))
    if (isNew) {
      create.mutate(payload, { onSuccess: () => navigate("/dashboard/projects"), onError })
    } else if (projectId != null) {
      update.mutate(payload, { onSuccess: () => navigate("/dashboard/projects"), onError })
    }
  }

  if (isLoading) return <PageWrapper title={t("projectWorkspace.form.editTitle")}><Skeleton className="h-24" /></PageWrapper>

  return (
    <PageWrapper
      title={isNew ? t("projectWorkspace.form.createTitle") : t("projectWorkspace.form.editTitle")}
      description={t("projectWorkspace.form.subtitle")}
    >
      <div className="mx-auto max-w-3xl space-y-4">
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
              <Label>{t("projectWorkspace.form.titleEn")}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.titleFa")}</Label>
              <Input value={titleFa} onChange={(e) => setTitleFa(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.titleAr")}</Label>
              <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.slug")}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-project-slug" />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.client")}</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.location")}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.startDate")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.endDate")}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>{t("projectWorkspace.form.liveUrl")}</Label>
              <Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://" dir="ltr" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("projectWorkspace.form.content")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.descriptionEn")}</Label>
              <Textarea rows={6} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.descriptionFa")}</Label>
              <Textarea rows={5} value={descriptionFa} onChange={(e) => setDescriptionFa(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.descriptionAr")}</Label>
              <Textarea rows={5} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("projectWorkspace.form.publishing")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("projectWorkspace.form.status")}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
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
                {t("projectWorkspace.form.isFeatured")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
                {t("projectWorkspace.form.isPublic")}
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard/projects")}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
            {isNew ? t("projectWorkspace.newProject") : t("common.save")}
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}