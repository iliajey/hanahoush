import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useLanguage } from "@/shared/hooks"
import { LANGUAGES, type LanguageCode } from "@/app/language/language.types"

import { cn } from "@/shared/lib/cn"
import { Button } from "./button"

/** Accessible language dropdown (Phase 14): replaces the fa→en→ar cycle
 * button with an explicit menu. Keyboard: Enter/Space opens, Escape closes,
 * arrows move between options. RTL-aware via logical props. */
export function LanguageDropdown({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const active = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]
  const label = t("app.languageLabel")

  useEffect(() => {
    if (!open) {
      setFocusIndex(-1)
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open ])

  useEffect(() => {
    if (focusIndex >= 0) itemRefs.current[focusIndex]?.focus()
  }, [focusIndex])

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-language-dropdown]")) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open ])

  const choose = (code: LanguageCode) => {
    setLanguage(code)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)} data-language-dropdown>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="gap-1.5"
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium">{active.nativeName}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </Button>
      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute end-0 top-full z-50 mt-1 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {LANGUAGES.map((item, index) => {
            const selected = item.code === language
            return (
              <button
                key={item.code}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(item.code)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    setFocusIndex((index + 1) % LANGUAGES.length)
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    setFocusIndex((index - 1 + LANGUAGES.length) % LANGUAGES.length)
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    choose(item.code)
                  }
                }}
                onMouseEnter={() => setFocusIndex(index)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent",
                  selected && "font-semibold",
                )}
              >
                <span className="flex-1 text-start" dir="auto">
                  {item.nativeName}
                  <span className="ms-2 text-xs font-normal text-muted-foreground">{item.label}</span>
                </span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
