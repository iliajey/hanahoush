import { Fragment, forwardRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"

export interface BreadcrumbItem {
  label: string
  href?: string
}

const Breadcrumb = forwardRef<HTMLElement, ComponentPropsWithoutRef<"nav"> & { items: BreadcrumbItem[] }>(
  ({ items, className, ...props }, ref) => {
    const { t } = useTranslation()
    const Chevron = typeof document !== "undefined" && document.documentElement.dir === "rtl" ? ChevronLeft : ChevronRight
    return (
      <nav
        ref={ref}
        aria-label={t("common.breadcrumb")}
        className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}
        {...props}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const content = isLast ? (
            <span aria-current="page" className="font-medium text-foreground">
              {item.label}
            </span>
          ) : item.href ? (
            <Link to={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && <Chevron className="h-3.5 w-3.5" />}
              {content}
            </Fragment>
          )
        })}
      </nav>
    )
  },
)
Breadcrumb.displayName = "Breadcrumb"

export { Breadcrumb }
