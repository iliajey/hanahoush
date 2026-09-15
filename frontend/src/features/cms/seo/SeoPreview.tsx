import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SeoPreviewCard({
  title,
  description,
  url,
  robots,
  locale,
  image,
}: {
  title: string
  description: string
  url: string
  robots: string
  locale: string
  image?: string | null
}) {
  const displayUrl = url.replace(/^https?:\/\//, "").slice(0, 60)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SEO preview · {locale.toUpperCase()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border p-3" aria-label="Search result preview">
          <p className="text-xs text-muted-foreground" dir="ltr">{displayUrl || "—"}</p>
          <p className="truncate text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8]" dir="auto">
            {title.slice(0, 60) || "—"}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground" dir="auto">
            {description.slice(0, 160) || "—"}
          </p>
          <p className="mt-1 flex gap-2 text-[11px] tabular-nums text-muted-foreground" dir="ltr">
            <span>{title.length}/60</span>
            <span>{description.length}/160</span>
          </p>
        </div>
        <div className="rounded-xl border p-3" aria-label="Social preview">
          {image ? (
            <img src={image} alt="" className="mb-2 aspect-[1200/630] w-full rounded-lg object-cover" loading="lazy" />
          ) : null}
          <p className="text-xs text-muted-foreground" dir="ltr">{displayUrl || "—"}</p>
          <p className="truncate text-sm font-semibold" dir="auto">
            {title || "—"}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground" dir="auto">
            {description || "—"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground" dir="ltr">
          canonical: {url || "—"} · robots: {robots || "index,follow"}
        </p>
      </CardContent>
    </Card>
  )
}
