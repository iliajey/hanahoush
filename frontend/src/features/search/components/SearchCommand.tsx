import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Search as SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/shared/lib/cn"

import { useDebouncedValue, useGlobalSearch } from "../hooks"
import { searchAnalytics } from "../services/analytics"
import { SearchInput } from "./SearchInput"
import { SearchResults } from "./SearchResults"

export interface SearchCommandProps {
  className?: string
}

/**
 * Command-palette search (Ctrl+K / ⌘K): debounced global search with
 * keyboard navigation over grouped results. Accessible via the Dialog focus
 * trap + arrow-key listbox pattern.
 */
export function SearchCommand({ className }: SearchCommandProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent)

  const query = useDebouncedValue(typed)
  const search = useGlobalSearch({ q: query })
  const results = useMemo(() => search.data?.items ?? [], [search.data])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    setTyped("")
    setActiveIndex(-1)
    searchAnalytics.view()
    const timer = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [open])

  const activate = useCallback(
    (index: number) => {
      const result = results[index]
      if (!result) return
      searchAnalytics.resultClick(result.type, result.url)
      setOpen(false)
      navigate(result.url)
    },
    [results, navigate],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (activeIndex >= 0) {
        activate(activeIndex)
      } else if (typed.trim()) {
        searchAnalytics.submit(typed.trim())
        setOpen(false)
        navigate(`/search?q=${encodeURIComponent(typed.trim())}`)
      }
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-2 text-muted-foreground", className)}
        aria-label={t("search.open")}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4" aria-hidden />
        <span className="hidden md:inline">{t("search.placeholder")}</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("search.open")}</DialogTitle>
          <div className="border-b p-3">
            <SearchInput
              ref={inputRef}
              value={typed}
              label={t("search.placeholder")}
              placeholder={t("search.placeholder")}
              onChange={(event) => {
                setTyped(event.target.value)
                setActiveIndex(-1)
              }}
              onKeyDown={onKeyDown}
              onClear={() => setTyped("")}
              hasValue={typed.length > 0}
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3">
            <SearchResults
              results={results}
              total={search.data?.pagination.count ?? 0}
              query={query}
              isLoading={search.isLoading}
              isError={search.isError}
              hasSearched={query.trim().length > 0}
              onRetry={() => search.refetch()}
              activeId={activeIndex >= 0 ? `${results[activeIndex]?.type}-${results[activeIndex]?.id}` : null}
              onActiveChange={() => undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}