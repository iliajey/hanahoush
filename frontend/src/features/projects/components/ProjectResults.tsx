import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

/**
 * Results / Impact block. Never invents metrics — it renders the qualitative
 * outcome supplied by the CMS (or omits gracefully).
 */
export function ProjectResults({ results }: { results?: string }) {
  const { t } = useTranslation()
  if (!results) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("projectResults.empty")}
      </p>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border bg-card p-6"
    >
      <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("projectResults.heading")}</div>
      <p className="mt-3 leading-relaxed text-muted-foreground">{results}</p>
    </motion.div>
  )
}