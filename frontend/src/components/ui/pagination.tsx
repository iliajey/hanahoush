import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/shared/lib/cn"
import { Button, type ButtonProps } from "./button"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  siblingCount?: number
}

function buildPageList(current: number, total: number, siblings = 1): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const left = Math.max(2, current - siblings)
  const right = Math.min(total - 1, current + siblings)
  const pages: Array<number | "ellipsis"> = [1]
  if (left > 2) pages.push("ellipsis")
  for (let p = left; p <= right; p += 1) pages.push(p)
  if (right < total - 1) pages.push("ellipsis")
  pages.push(total)
  return pages
}

export function Pagination({ currentPage, totalPages, onPageChange, className, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageList(currentPage, totalPages, siblingCount)
  const pageButtonProps: Pick<ButtonProps, "size" | "variant"> = { size: "icon", variant: "outline" }

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-1", className)}
    >
      <Button
        {...pageButtonProps}
        variant="ghost"
        aria-label="Previous page"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronRight className="rtl:rotate-180" />
      </Button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={page}
            {...pageButtonProps}
            variant={page === currentPage ? "default" : "outline"}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        {...pageButtonProps}
        variant="ghost"
        aria-label="Next page"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronLeft className="rtl:rotate-180" />
      </Button>
    </nav>
  )
}
