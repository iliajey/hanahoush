import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { getInitialLocale, SUPPORTED_LOCALES, type Locale } from "./config"
import en from "./locales/en/translation.json"
import fa from "./locales/fa/translation.json"
import ar from "./locales/ar/translation.json"

void i18n.use(initReactI18next).init({
  debug: import.meta.env.VITE_ENV !== "production",
  lng: getInitialLocale(),
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LOCALES,
  resources: {
    en: { translation: en },
    fa: { translation: fa },
    ar: { translation: ar },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export type { Locale }
export { SUPPORTED_LOCALES }
export default i18n
