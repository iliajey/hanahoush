/** Labeled case-study body block (challenge / objectives / solution). */
import type { ReactNode } from "react"
import { motion } from "framer-motion"

export function CaseStudySection({
  label,
  title,
  body,
  children,
}: {
  label: string
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
    >
      <span className="inline-flex rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
        {label}
      </span>
      <h3 className="mt-3 text-2xl font-bold">{title}</h3>
      {body ? <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{body}</p> : null}
      {children}
    </motion.div>
  )
}