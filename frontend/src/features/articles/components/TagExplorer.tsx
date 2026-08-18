import { motion } from "framer-motion"

import { articleAnalytics } from "../services/analytics"
import type { ArticleTagSummary } from "../types"

/** Topic / tag explorer — real tags from the CMS. */
export function TagExplorer({ tags }: { tags: ArticleTagSummary[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Topics">
      {tags.map((tag, i) => (
        <motion.a
          key={tag.id}
          href={`/articles?tag=${tag.slug}`}
          onClick={() => articleAnalytics.tagClick(tag.slug)}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
          className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-brand-500/40"
        >
          {tag.title_en} <span className="text-xs text-muted-foreground">({tag.articles_count ?? 0})</span>
        </motion.a>
      ))}
    </div>
  )
}