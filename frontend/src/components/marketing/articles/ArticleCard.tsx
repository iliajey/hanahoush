import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { RevealContainer } from "../common/RevealContainer"
import { Badge } from "@/components/ui/badge"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"

export interface ArticleCardProps {
  title: string; description: string; image?: string; category?: string; readTime?: string; date?: string; featured?: boolean; className?: string
}

export function ArticleCard({ title, description, image, category, readTime, date, featured, className }: ArticleCardProps) {
  return (
    <RevealContainer className={cn("group overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-lg", featured && "lg:col-span-2 lg:grid lg:grid-cols-2", className)}>
      {image && <div className="aspect-video overflow-hidden bg-muted"><ResponsiveImage src={image} alt={title} className="h-full w-full transition-transform duration-500 group-hover:scale-105" /></div>}
      <div className="flex flex-col gap-2 p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {category && <CategoryBadge label={category} />}{date && <span>{date}</span>}{readTime && <span>· {readTime}</span>}
        </div>
        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </RevealContainer>
  )
}

export function ArticleGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
}

export function CategoryBadge({ label }: { label: string }) { return <Badge variant="secondary" className="text-xs">{label}</Badge> }
export function ReadingTime({ minutes }: { minutes: number }) { return <span className="text-xs text-muted-foreground">{minutes} min read</span> }
