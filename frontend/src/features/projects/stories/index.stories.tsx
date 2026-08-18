import type { Meta, StoryObj } from "@storybook/react"

import {
  ArchitectureViewer,
  FeaturedProjectCard,
  ProjectFilterBar,
  ProjectGallery,
  ProjectResults,
  ProjectsTimeline,
} from "@/features/projects/components"

export default {
  title: "Projects/Experience",
  tags: ["autodocs"],
} satisfies Meta

const featured = {
  id: 1,
  slug: "demo-erp-system",
  title: "Enterprise Resource Planning System",
  description: "A full hanRP deployment with finance, procurement, HR and inventory modules.",
  image: undefined,
  client: "Pars Industrial",
  year: 2025,
  technologies: ["Django", "React", "PostgreSQL", "Redis"],
  category: "Enterprise",
  featured: true,
}

export const ProjectHeroCard: StoryObj = {
  name: "ProjectHero (FeaturedProjectCard)",
  render: () => (
    <div className="space-y-16">
      <FeaturedProjectCard project={featured} index={0} />
      <FeaturedProjectCard project={{ ...featured, slug: "demo-shop", title: "Online Shop Platform", category: "Web", year: 2024 }} index={1} />
    </div>
  ),
}

export const ProjectFilters: StoryObj = {
  render: () => (
    <ProjectFilterBar
      filters={{}}
      onChange={() => {}}
      categories={[
        { id: 1, title_en: "Web", slug: "web" },
        { id: 3, title_en: "Enterprise", slug: "enterprise" },
      ]}
      technologies={[{ id: 1, title_en: "Django", slug: "django", projects_count: 5 }]}
      years={[2025, 2024]}
      count={12}
    />
  ),
}

export const ArchitectureViewerStory: StoryObj = {
  name: "ArchitectureViewer",
  render: () => (
    <ArchitectureViewer
      architecture={{
        description: "Standard layered architecture.",
        nodes: [
          { layer: "Frontend", labels: [{ en: "React" }, { en: "TypeScript" }] },
          { layer: "Backend", labels: ["Django", "REST API"] },
          { layer: "Database", labels: ["PostgreSQL"] },
          { layer: "Services", labels: [{ en: "External services" }] },
        ],
      }}
    />
  ),
}

export const ArchitectureFallback: StoryObj = {
  name: "ArchitectureViewer (fallback)",
  render: () => <ArchitectureViewer architecture={null} />,
}

const galleryImages = [
  { src: "https://picsum.photos/seed/h1/600/600", alt: "Dashboard", caption: "Finance dashboard" },
  { src: "https://picsum.photos/seed/h2/600/600", alt: "Reports", caption: "Reports module" },
  { src: "https://picsum.photos/seed/h3/600/600", alt: "Mobile", caption: "Mobile view" },
]

export const Gallery: StoryObj = {
  render: () => <ProjectGallery images={galleryImages} />,
}

const timelineProjects: Parameters<typeof ProjectsTimeline>[0]["projects"] = [
  { id: 1, slug: "p1", title: "ERP", title_en: "ERP", category: { id: 3, title_en: "Enterprise", slug: "enterprise" }, technologies: [], cover_image: null, is_public: true, is_featured: true, end_date: "2025-03-01", year: 2025 },
  { id: 2, slug: "p2", title: "Shop", title_en: "Shop", category: { id: 1, title_en: "Web", slug: "web" }, technologies: [], cover_image: null, is_public: true, is_featured: false, end_date: "2024-06-01", year: 2024 },
]

export const Timeline: StoryObj = {
  name: "ProjectsTimeline",
  render: () => <ProjectsTimeline projects={timelineProjects} />,
}

export const Results: StoryObj = {
  render: () => <ProjectResults results="A dependable, maintainable system delivered through a transparent process." />,
}

export const RelatedProjects: StoryObj = {
  render: () => (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { slug: "a", title: "Analytics Dashboard" },
        { slug: "b", title: "Corporate Website" },
        { slug: "c", title: "Mobile App" },
      ].map((item) => (
        <a key={item.slug} href={`/projects/${item.slug}`} className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-500/40">
          <h4 className="font-semibold group-hover:text-primary">{item.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">Related project case study.</p>
        </a>
      ))}
    </div>
  ),
}