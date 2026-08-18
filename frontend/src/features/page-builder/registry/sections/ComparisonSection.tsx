import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

import { SectionHeading, type SectionProps } from "./common"

interface ComparisonRow {
  factor?: string
  traditional?: string
  hanahoush?: string
}

interface ColumnLabel {
  label?: string
}

/** Traditional vs Hanahoush comparison table. */
export default function ComparisonSection({ config }: SectionProps) {
  const rows = Array.isArray(config.rows) ? (config.rows as ComparisonRow[]) : []
  const columns = (Array.isArray(config.columns) ? config.columns : []) as ColumnLabel[]
  const traditionalLabel = columns[0]?.label || "Traditional"
  const hanahoushLabel = columns[1]?.label || "Hanahoush"

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border bg-card"
      >
        <div className="grid grid-cols-3 border-b bg-muted/50 text-sm font-semibold">
          <div className="p-4 text-muted-foreground">{traditionalLabel}</div>
          <div className="p-4 text-muted-foreground" />
          <div className="bg-brand-500/10 p-4 text-brand-700 dark:text-brand-300">{hanahoushLabel}</div>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-3 border-b text-sm last:border-0">
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <X className="h-4 w-4 shrink-0 text-destructive" />
              <span>{row.traditional}</span>
            </div>
            <div className="flex items-center justify-center p-4">
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {row.factor}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-brand-500/5 p-4">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{row.hanahoush}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}