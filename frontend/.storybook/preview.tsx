import type { Preview, Decorator } from "@storybook/react-vite"
import { useEffect } from "react"

// Fonts + global styles
import "@fontsource-variable/inter"
import "@fontsource-variable/vazirmatn"
import "../src/styles/globals.css"

import ThemeProvider from "../src/app/theme/ThemeProvider"
import LanguageProvider, { type LanguageCode } from "../src/app/language/LanguageProvider"
import QueryProvider from "../src/shared/api/QueryProvider"

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as "light" | "dark"
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.setAttribute("data-theme", theme)
  }, [theme])
  return <Story />
}

const withProviders: Decorator = (Story) => (
  <ThemeProvider>
    <LanguageProvider>
      <QueryProvider>
        <Story />
      </QueryProvider>
    </LanguageProvider>
  </ThemeProvider>
)

const withDirection: Decorator = (Story, context) => {
  const locale = context.globals.locale as LanguageCode
  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = locale === "en" ? "ltr" : "rtl"
  }, [locale])
  return <Story />
}

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: { disable: true },
    viewport: {
      viewports: {
        mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
  globalTypes: {
    theme: {
      description: "UI theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: "Language & text direction",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: [
          { value: "fa", title: "فارسی (RTL)" },
          { value: "en", title: "English (LTR)" },
          { value: "ar", title: "العربية (RTL)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
    locale: "fa",
  },
  decorators: [withDirection, withTheme, withProviders],
}

export default preview
