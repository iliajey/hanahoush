import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { THEME_KEY, Theme, ThemeProviderContext } from "./theme.types"

export { Theme, ThemeProviderContext }

const THEME_TRANSITION_CLASS = "theme-transition"

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return Theme.LIGHT
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? Theme.DARK : Theme.LIGHT
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return Theme.SYSTEM
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === Theme.LIGHT || stored === Theme.DARK || stored === Theme.SYSTEM) return stored
  } catch {
    /* ignore storage errors */
  }
  return Theme.SYSTEM
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = theme === Theme.SYSTEM ? getSystemTheme() : theme
  root.classList.toggle("dark", resolved === Theme.DARK)
  root.setAttribute("data-theme", resolved)
  root.style.colorScheme = resolved
}

/** Enable a short CSS transition window so theme switching animates smoothly. */
function withThemeTransition(fn: () => void) {
  const root = document.documentElement
  root.classList.add(THEME_TRANSITION_CLASS)
  fn()
  window.setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), 360)
}

export default function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() =>
    getInitialTheme() === Theme.SYSTEM ? getSystemTheme() : getInitialTheme(),
  )

  // Apply theme on mount + when it changes (mount is non-animated).
  useEffect(() => {
    const resolved = theme === Theme.SYSTEM ? getSystemTheme() : theme
    setResolvedTheme(resolved)
    applyTheme(theme)
  }, [theme])

  // Follow system preference changes when in "system" mode.
  useEffect(() => {
    if (theme !== Theme.SYSTEM) return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (event: MediaQueryListEvent) => {
      const next = event.matches ? Theme.DARK : Theme.LIGHT
      setResolvedTheme(next)
      applyTheme(Theme.SYSTEM)
    }
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    withThemeTransition(() => applyTheme(next))
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      /* ignore storage errors */
    }
  }, [])

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}
