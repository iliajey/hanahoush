/**
 * Application-wide constants.
 * Kept in a single module so there are no magic strings across features.
 */
export const APP_NAME = "Hanahoush"
export const APP_VERSION = "0.1.0"

export const STORAGE_KEYS = {
  THEME: "hanahoush-theme",
  LOCALE: "i18next",
} as const

export const DEBOUNCE_MS = 300
