import { forwardRef } from "react"
import type { InputHTMLAttributes } from "react"
import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label (optional — a sr-only label is rendered for a11y). */
  label?: string
  onClear?: () => void
  hasValue?: boolean
}

/** Accessible, RTL-safe search input with a clear button. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, label, onClear, hasValue, type = "search", ...props }, ref) => {
    const { t } = useTranslation()
    return (
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={ref}
          type={type}
          aria-label={label ?? t("search.open")}
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {hasValue && onClear ? (
          <button
            type="button"
            aria-label={t("search.clear")}
            onClick={onClear}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    )
  },
)
SearchInput.displayName = "SearchInput"
