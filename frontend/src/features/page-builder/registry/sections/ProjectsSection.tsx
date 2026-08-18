import { useLanguage } from "@/app/language/useLanguage"
import { ProjectCard, ProjectGrid } from "@/components/marketing/projects"
import { useFeaturedProjects } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapProjects } from "@/features/cms/mappers"

import { SectionHeading, type SectionProps } from "./common"

/** Featured portfolio projects. */
export default function ProjectsSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const projects = useFeaturedProjects(Number(config.limit ?? 3))

  return (
    <section className="py-20">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={projects.isLoading}
        isError={projects.isError}
        onRetry={() => projects.refetch()}
        isEmpty={!projects.data?.length}
      >
        <ProjectGrid className="mt-12">
          {mapProjects(projects.data ?? [], language).map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              image={project.image}
              tags={project.tags}
              client={project.client}
              featured={project.featured}
            />
          ))}
        </ProjectGrid>
      </CmsAsync>
    </section>
  )
}
