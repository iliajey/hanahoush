import { motion } from "framer-motion"
import { Boxes } from "lucide-react"

import { sectionIcon, SectionHeading, type SectionProps } from "./common"

/** Animated technology stack showcase. */
export default function StackSection({ config }: SectionProps) {
  const technologies = Array.isArray(config.technologies)
    ? (config.technologies as Array<{ icon?: string; name?: string } | string>)
    : []

  const normalized = technologies.map((tech, i) => {
    if (typeof tech === "string") return { name: tech, icon: undefined, index: i }
    return { name: tech.name, icon: tech.icon, index: i }
  })

  return (
    <section className="overflow-hidden py-20">
      <SectionHeading config={config} />
      <div className="container-hanahoush mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {normalized.map((tech) => {
          const Icon = tech.icon ? sectionIcon(tech.icon, tech.index) : Boxes
          return (
            <motion.div
              key={`${tech.name}-${tech.index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (tech.index % 4) * 0.06 }}
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-medium transition-colors hover:border-brand-500/40 hover:shadow-md"
            >
              <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              {tech.name}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}