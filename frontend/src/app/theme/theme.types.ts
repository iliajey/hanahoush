import { createContext } from "react"

export const THEME_KEY = "hanahoush-theme"
export const SYSTEM_THEME = "system"

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

export interface ThemeProviderState {
  theme: Theme
  resolvedTheme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: Theme.SYSTEM,
  resolvedTheme: Theme.LIGHT,
  setTheme: () => undefined,
})
