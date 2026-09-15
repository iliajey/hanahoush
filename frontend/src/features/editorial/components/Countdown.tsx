import { useTranslation } from "react-i18next"

/** Lightweight schedule countdown. Minute-level precision; no timers inside. */
export function formatCountdown(iso: string, now: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return ""
  const diff = target - now
  if (Math.abs(diff) < 60_000) return diff <= 0 ? t("publication.countdown.overdue", { ago: "1m" }) : t("publication.countdown.now")
  if (diff < 0) {
    const mins = Math.round(-diff / 60000)
    const ago = mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`
    return t("publication.countdown.overdue", { ago })
  }
  const mins = Math.round(diff / 60000)
  if (mins < 60) return t("publication.countdown.minutes", { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t("publication.countdown.hours", { h: hours, m: mins % 60 })
  const date = new Date(target)
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === tomorrow.toDateString()) return t("publication.countdown.tomorrow", { time })
  if (diff < 7 * 86400000) {
    const weekday = date.toLocaleDateString([], { weekday: "long" })
    return t("publication.countdown.weekday", { weekday, time })
  }
  return t("publication.countdown.date", { date: date.toLocaleDateString() })
}

export function Countdown({ iso, now }: { iso: string; now: number }) {
  const { t } = useTranslation()
  const label = formatCountdown(iso, now, t as (k: string, o?: Record<string, unknown>) => string)
  if (!label) return null
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()} className="shrink-0 tabular-nums text-xs text-muted-foreground" dir="auto">
      {label}
    </time>
  )
}
