import type { ReactNode } from "react"

import { Container } from "@/components/layout"
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb"

export interface PageWrapperProps {
  title?: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: ReactNode
  children: ReactNode
}

/** Standard page scaffolding: breadcrumb + title + content. */
export function PageWrapper({ title, description, breadcrumb, actions, children }: PageWrapperProps) {
  return (
    <div className="py-10">
      <Container className="flex flex-col gap-8">
        {(breadcrumb || title) ? (
          <header className="flex flex-col gap-4">
            {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {title ? <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1> : null}
                {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
              </div>
              {actions}
            </div>
          </header>
        ) : null}
        {children}
      </Container>
    </div>
  )
}
