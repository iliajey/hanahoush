import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { Badge } from "@/components/ui/badge"
import { RevealContainer } from "../common/RevealContainer"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"

export interface ProjectCardProps {
  title: string; description: string; image?: string; tags: string[]; client?: string; featured?: boolean; className?: string
}

export function ProjectCard({ title, description, image, tags, client, featured, className }: ProjectCardProps) {
  return (
    <RevealContainer className={cn("group overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-lg", featured && "lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-0", className)}>
      {image && <div className="aspect-video overflow-hidden bg-muted"><ResponsiveImage src={image} alt={title} className="h-full w-full transition-transform duration-500 group-hover:scale-105" /></div>}
      <div className="flex flex-col gap-3 p-6">
        {client && <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{client}</span>}
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (<Badge key={t} variant="secondary" className="text-xs">{t}</Badge>))}
        </div>
      </div>
    </RevealContainer>
  )
}

export function ProjectGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
}

export function TechnologyChip({ label, icon }: { label: string; icon?: ReactNode }) {
  return <Badge variant="outline" className="gap-1.5 text-xs">{icon}{label}</Badge>
}

export function GalleryPreview({ images, className }: { images: string[]; className?: string }) {
  return <div className={cn("flex gap-2 overflow-hidden rounded-xl", className)}>{images.slice(0, 3).map((src, i) => (<div key={i} className="aspect-square flex-1 overflow-hidden bg-muted"><ResponsiveImage src={src} alt={`Gallery image ${i + 1}`} className="h-full w-full" /></div>))}</div>
}
