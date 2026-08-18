import { motion } from "framer-motion"

import { articleAnalytics } from "../services/analytics"
import type { ArticleCategorySummary } from "../types"

/** Category explorer — categories from the CMS (never hardcoded). */
export function CategoryExplorer({ categories }: { categories: ArticleCategorySummary[] }) {
  if (categories.length === 0) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, i) => (
        <motion.a
          key={category.id}
          href={`/articles?category=${category.slug}`}
          onClick={() => articleAnalytics.categoryClick(category.slug)}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-500/40"
        >
          <h3 className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">{category.title_en}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{category.articles_count ?? 0} article(s)</p>
        </motion.a>
      ))}
    </div>
  )
}