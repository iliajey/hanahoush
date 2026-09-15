import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Search as SearchIcon, CornerDownLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/shared/lib/cn"
import { useTheme } from "@/shared/hooks"
import { useLanguage } from "@/shared/hooks"
import { LANGUAGES } from "@/app/language/language.types"
import { Theme } from "@/app/theme/theme.types"
import { AuthContext } from "@/features/auth/services/AuthProvider"

import { useDebouncedValue, useGlobalSearch } from "../hooks"
import { searchAnalytics } from "../services/analytics"
import { SearchInput } from "./SearchInput"
import { SearchResults } from "./SearchResults"
import { commandsForUser, filterCommands, type CommandItem } from "./commands"
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog"

export interface SearchCommandProps {
  className?: string
}

const RECENT_KEY = "hanahoush-command-recent"
const MAX_RECENT = 5

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

/**
 * Command Center (Phase 19): the existing Ctrl+K palette upgraded from
 * search-only to commands + search. Search behavior, grouping, analytics and
 * the Dialog focus trap are unchanged; commands are permission-aware and
 * keyboard navigable in one flat list.
 */
export function SearchCommand({ className }: SearchCommandProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Auth is optional here so public pages and unit tests can render the
  // palette without an AuthProvider; commands degrade to public-only.
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user ?? null
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent)

  const query = useDebouncedValue(typed)
  const search = useGlobalSearch({ q: query })
  const results = useMemo(() => search.data?.items ?? [], [search.data])

  const allCommands = useMemo(() => commandsForUser(user), [user])
  const matched = useMemo(() => filterCommands(allCommands, typed, t), [allCommands, typed, t])
  const hasQuery = typed.trim().length > 0
  const showSearch = query.trim().length > 0

  const recentCommands = useMemo(
    () => recent.map((id) => allCommands.find((c) => c.id === id)).filter((c): c is CommandItem => Boolean(c)),
    [recent, allCommands],
  )

  type Entry = { key: string; kind: "command" | "result"; command?: CommandItem; index?: number }
  const entries: Entry[] = useMemo(() => {
    const list: Entry[] = []
    for (const c of matched) list.push({ key: `cmd-${c.id}`, kind: "command", command: c })
    if (showSearch) results.forEach((_, i) => list.push({ key: `res-${i}`, kind: "result", index: i }))
    return list
  }, [matched, results, showSearch])

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
    setRecent(readRecent())
    searchAnalytics.view()
    const timer = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    setActiveIndex(-1)
  }, [typed])

  useEffect(() => {
    if (activeIndex < 0) return
    listRef.current?.querySelector<HTMLElement>(`[data-entry="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const remember = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((v) => v !== id)].slice(0, MAX_RECENT)
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        /* ignore storage errors */
      }
      return next
    })
  }, [])

  const runCommand = useCallback(
    (command: CommandItem) => {
      remember(command.id)
      if (command.action === "theme") {
        setTheme(theme === Theme.DARK ? Theme.LIGHT : theme === Theme.LIGHT ? Theme.DARK : Theme.DARK)
        setOpen(false)
        return
      }
      if (command.action === "language") {
        const order = LANGUAGES.map((l) => l.code)
        const next = order[(order.indexOf(language) + 1) % order.length] ?? "fa"
        setLanguage(next)
        setOpen(false)
        return
      }
      if (command.action === "shortcuts") {
        setOpen(false)
        setShortcutsOpen(true)
        return
      }
      setOpen(false)
      if (command.href) navigate(command.href)
    },
    [navigate, remember, setTheme, theme, language, setLanguage],
  )

  const activateResult = useCallback(
    (index: number) => {
      const result = results[index]
      if (!result) return
      searchAnalytics.resultClick(result.type, result.url)
      setOpen(false)
      navigate(result.url)
    },
    [results, navigate],
  )

  const activateEntry = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return
      if (entry.kind === "command" && entry.command) runCommand(entry.command)
      else if (entry.kind === "result" && entry.index != null) activateResult(entry.index)
    },
    [runCommand, activateResult],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (entries.length) setActiveIndex((i) => (i + 1) % entries.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (entries.length) setActiveIndex((i) => (i <= 0 ? entries.length - 1 : i - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (activeIndex >= 0) {
        activateEntry(entries[activeIndex])
      } else if (matched.length > 0 && !showSearch) {
        runCommand(matched[0])
      } else if (typed.trim()) {
        searchAnalytics.submit(typed.trim())
        setOpen(false)
        navigate(`/search?q=${encodeURIComponent(typed.trim())}`)
      }
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const c of matched) {
      const list = map.get(c.category) ?? []
      list.push(c)
      map.set(c.category, list)
    }
    return [...map.entries()]
  }, [matched])

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
        <span className="hidden xl:inline">{t("search.placeholder")}</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground xl:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl w-[calc(100vw-2rem)] max-h-[calc(100dvh-4rem)] overflow-y-auto p-0 top-[6vh] translate-y-0 data-[state=open]:slide-in-from-top-4"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t("commandCenter.title")}</DialogTitle>
          <div className="border-b p-3">
            <SearchInput
              ref={inputRef}
              value={typed}
              label={t("commandCenter.placeholder")}
              placeholder={t("commandCenter.placeholder")}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={onKeyDown}
              onClear={() => setTyped("")}
              hasValue={typed.length > 0}
              role="combobox"
              aria-expanded="true"
              aria-controls="command-center-list"
              aria-activedescendant={activeIndex >= 0 ? `command-entry-${activeIndex}` : undefined}
            />
          </div>
          <div ref={listRef} id="command-center-list" role="listbox" aria-label={t("commandCenter.title")} className="max-h-[60vh] overflow-y-auto p-3">
            {!hasQuery && recentCommands.length > 0 ? (
              <section aria-label={t("commandCenter.recent")} className="mb-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("commandCenter.recent")}
                </h2>
                <ul className="flex flex-col gap-1">
                  {recentCommands.map((c) => (
                    <CommandRow
                      key={c.id}
                      command={c}
                      onRun={() => runCommand(c)}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            {grouped.map(([category, items]) => (
              <section key={category} aria-label={t(`commandCenter.categories.${category}`)} className="mb-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`commandCenter.categories.${category}`)}
                </h2>
                <ul className="flex flex-col gap-1">
                  {items.map((c) => {
                    const flatIndex = entries.findIndex((e) => e.key === `cmd-${c.id}`)
                    return (
                      <CommandRow
                        key={c.id}
                        command={c}
                        active={flatIndex === activeIndex}
                        entryIndex={flatIndex}
                        onRun={() => runCommand(c)}
                        onHover={() => flatIndex >= 0 && setActiveIndex(flatIndex)}
                      />
                    )
                  })}
                </ul>
              </section>
            ))}

            {showSearch || hasQuery ? (
              <section aria-label={t("commandCenter.searchSection")}>
                {matched.length === 0 && results.length === 0 && !search.isLoading && !search.isError ? (
                  <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-sm font-medium">{t("commandCenter.emptyTitle")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("commandCenter.emptyDescription")}</p>
                  </div>
                ) : (
                  <SearchResults
                    results={results}
                    total={search.data?.pagination.count ?? 0}
                    query={query}
                    isLoading={search.isLoading}
                    isError={search.isError}
                    hasSearched={showSearch}
                    onRetry={() => search.refetch()}
                    activeId={undefined}
                    onActiveChange={() => undefined}
                  />
                )}
                {results.length > 0 ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CornerDownLeft className="h-3 w-3" aria-hidden />
                    {t("commandCenter.resultHint")}
                  </p>
                ) : null}
              </section>
            ) : (
              <p className="text-[11px] text-muted-foreground">{t("commandCenter.hint")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  )
}

function CommandRow({
  command,
  active,
  entryIndex,
  onRun,
  onHover,
}: {
  command: CommandItem
  active?: boolean
  entryIndex?: number
  onRun: () => void
  onHover?: () => void
}) {
  const { t } = useTranslation()
  const Icon = command.icon
  return (
    <li role="option" aria-selected={Boolean(active)} id={entryIndex != null && entryIndex >= 0 ? `command-entry-${entryIndex}` : undefined} data-entry={entryIndex}>
      <button
        type="button"
        onClick={onRun}
        onMouseEnter={onHover}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-start text-sm transition-colors hover:border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "border-border bg-accent",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-medium">{t(command.labelKey)}</span>
        {command.hintKey ? (
          <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {t(command.hintKey)}
          </kbd>
        ) : null}
      </button>
    </li>
  )
}
