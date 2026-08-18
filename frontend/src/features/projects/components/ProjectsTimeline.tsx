import { motion } from "framer-motion"

import type { ProjectSummary } from "../types"

/** Groups a flat project list by completion year into an animated timeline. */
export function ProjectsTimeline({ projects }: { projects: ProjectSummary[] }) {
  const byYear = new Map<number, ProjectSummary[]>()
  for (const project of projects) {
    const year = project.year ?? (project.end_date ? new Date(project.end_date).getFullYear() : null)
    if (year == null) continue
    const bucket = byYear.get(year) ?? []
    bucket.push(project)
    byYear.set(year, bucket)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a)

  if (years.length === 0) {
    return <p className="text-sm text-muted-foreground">No dated projects to show yet.</p>
  }

  return (
    <ol className="relative space-y-8 border-l border-border pl-6">
      {years.map((year, i) => (
        <motion.li
          key={year}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="relative"
        >
          <span className="absolute -left-[31px] top-0 rounded-full border-2 border-brand-500 bg-card px-2 py-0.5 text-xs font-bold">
            {year}
          </span>
          <div className="flex flex-col gap-2">
            {byYear.get(year)?.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group rounded-xl border bg-card p-3 transition-colors hover:border-brand-500/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium group-hover:text-primary">{project.title_en}</span>
                  {project.category ? <span className="text-xs text-muted-foreground">{project.category.title_en}</span> : null}
                </div>
              </a>
            ))}
          </div>
        </motion.li>
      ))}
    </ol>
  )
}