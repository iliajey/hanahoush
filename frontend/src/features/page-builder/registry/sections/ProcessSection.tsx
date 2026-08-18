import { motion } from "framer-motion"

import { SectionHeading, type SectionProps } from "./common"

/** Delivery process — Discovery → … → Support. */
export default function ProcessSection({ config }: SectionProps) {
  const steps = Array.isArray(config.steps) ? (config.steps as string[]) : []

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <div className="container-hanahoush mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {steps.map((name, i) => (
          <motion.div
            key={`${name}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
            className="relative rounded-2xl border bg-card p-6"
          >
            <span className="font-mono text-3xl font-black text-brand-500/15">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mt-4 flex items-center gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-sm font-bold text-brand-600 dark:text-brand-400"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h4 className="font-semibold">{name}</h4>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}