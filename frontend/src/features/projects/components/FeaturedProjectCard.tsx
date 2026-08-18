import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"
import type { FeaturedProjectView } from "@/features/projects/mappers"

/** Editorial-style featured project presentation (asymmetric, not a card grid). */
export function FeaturedProjectCard({
  project,
  index = 0,
  onView,
}: {
  project: FeaturedProjectView
  index?: number
  onView?: (slug: string) => void
}) {
  const reversed = index % 2 === 1
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      className={`grid items-center gap-8 lg:grid-cols-12 ${reversed ? "lg:[direction:rtl]" : ""}`}
    >
      <div className={`relative overflow-hidden rounded-3xl border lg:col-span-7 ${reversed ? "lg:col-start-6" : ""}`}>
        <div className="aspect-[16/9]">
          <ResponsiveImage src={project.image} alt={project.title} className="h-full w-full" />
        </div>
      </div>
      <div className={`lg:col-span-5 ${reversed ? "lg:col-start-1 lg:row-start-1" : ""}`}>
        {project.featured ? <Badge variant="secondary" className="mb-3">Featured</Badge> : null}
        {project.category ? <span className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{project.category}</span> : null}
        <h3 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h3>
        {project.year ? <p className="mt-1 text-sm text-muted-foreground">{project.year}</p> : null}
        <p className="mt-4 max-w-xl text-muted-foreground">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 6).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
          ))}
        </div>
        <Button className="mt-6" asChild>
          <a href={`/projects/${project.slug}`} onClick={() => onView?.(project.slug)}>
            Read the case study <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" />
          </a>
        </Button>
      </div>
    </motion.article>
  )
}