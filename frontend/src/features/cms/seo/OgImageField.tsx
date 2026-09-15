import { useTranslation } from "react-i18next"
import { ImagePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function OgImageField({
  id,
  preview,
  onChoose,
  onRemove,
}: {
  id: string
  preview: string | null
  onChoose: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{t("seo.ogImage")}</Label>
        <Button type="button" variant="outline" size="sm" onClick={onChoose}>
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {preview ? t("seo.replaceOgImage") : t("seo.chooseOgImage")}
        </Button>
      </div>
      {preview ? (
        <div id={id} className="overflow-hidden rounded-xl border">
          <img src={preview} alt="" className="aspect-[1200/630] h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <p id={id} className="text-xs text-muted-foreground">
          {t("seo.noOgImage")}
        </p>
      )}
      {preview ? (
        <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={onRemove}>
          {t("seo.removeOgImage")}
        </Button>
      ) : null}
    </div>
  )
}
