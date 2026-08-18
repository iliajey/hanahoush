import { useContext, useEffect } from "react"

import { Theme, ThemeProviderContext } from "./theme.types"

/** Hook for components to read/write the active theme. */
export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  const { theme, resolvedTheme, setTheme } = context

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === Theme.DARK)
  }, [resolvedTheme])

  return { theme, setTheme, resolvedTheme }
}
