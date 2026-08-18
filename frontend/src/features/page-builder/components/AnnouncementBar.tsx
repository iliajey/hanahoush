import { useState } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"
import { useAnnouncement } from "../hooks"
import type { Announcement } from "../types"

/**
 * Announcement bar rendered at the top of every page. Data comes from the
 * `/api/v1/announcement/` endpoint; it is dismissible and time-boxed by the
 * backend configuration. An ``announcement`` prop may be passed for
 * presentational use (e.g. Storybook).
 */
export function AnnouncementBar({ announcement, className }: { announcement?: Announcement; className?: string }) {
  const { t } = useTranslation()
  const query = useAnnouncement()
  const [dismissed, setDismissed] = useState(false)
  const data = announcement ?? query.data

  if (!data?.is_enabled || dismissed) return null

  const now = Date.now()
  if (data.start_at && new Date(data.start_at).getTime() > now) return null
  if (data.end_at && new Date(data.end_at).getTime() < now) return null

  const isBrand = data.background_color === "brand"
  const bgClass = isBrand ? "bg-brand-600 text-white" : ""
  return (
    <div
      role="region"
      aria-label={t("app.announcement")}
      className={cn("flex items-center justify-center gap-3 px-4 py-2 text-center text-sm", bgClass, className)}
      style={!isBrand && data.background_color ? { backgroundColor: data.background_color } : undefined}
    >
      <span>{data.text}</span>
      {data.link ? (
        <a href={data.link} className="font-medium underline underline-offset-2 hover:opacity-80">
          {data.link_label || t("app.readMore")}
        </a>
      ) : null}
      {data.dismissible ? (
        <button
          type="button"
          aria-label={t("app.dismissAnnouncement")}
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
