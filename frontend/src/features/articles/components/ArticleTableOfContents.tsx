import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"
import type { TocEntry } from "../types"

/** Table of contents generated from article headings. */
export function ArticleTableOfContents({ toc, className }: { toc: TocEntry[]; className?: string }) {
  const { t } = useTranslation()
  if (toc.length === 0) return null
  return (
    <nav aria-label={t("article.toc")} className={cn("space-y-1 text-sm", className)}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("article.onThisPage")}</h4>
      {toc.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={cn(
            "block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            entry.level === 3 && "pl-5",
          )}
        >
          {entry.text}
        </a>
      ))}
    </nav>
  )
}