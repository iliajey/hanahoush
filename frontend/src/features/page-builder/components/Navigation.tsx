import { cn } from "@/shared/lib/cn"
import type { NavItem } from "@/features/cms/types"

/**
 * Presentational navigation bar used by Storybook, the dev console and any
 * embeddable surface. The production site chrome lives in
 * `src/app/layouts/Navbar.tsx` and reads the same `/api/v1/navigation/` data.
 */
export function PageNavigation({
  items,
  cta,
  brand,
  className,
}: {
  items: NavItem[]
  cta?: NavItem | null
  brand?: string
  className?: string
}) {
  return (
    <header className={cn("sticky top-0 z-40 border-b bg-background/80 backdrop-blur", className)}>
      <div className="container-hanahoush flex h-14 items-center justify-between gap-4">
        <span className="font-bold tracking-tight">{brand ?? "Hanahoush"}</span>
        <nav aria-label="Main" className="flex items-center gap-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {cta ? (
          <a
            href={cta.href}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {cta.label}
          </a>
        ) : null}
      </div>
    </header>
  )
}
