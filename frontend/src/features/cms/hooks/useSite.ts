import { useLanguage } from "@/app/language/useLanguage"

import { fetchFooter, fetchNavigation, fetchSiteSettings } from "../api/site"
import { cmsKeys } from "../queries/keys"
import type { Footer, Navigation, SiteSettings } from "../types"

import { useCmsQuery } from "./useCmsQuery"

/** Global site settings (singleton). */
export function useSiteSettings() {
  const locale = useLanguage().language
  return useCmsQuery<SiteSettings>(
    cmsKeys.site.settings(locale),
    () => fetchSiteSettings({ locale }),
    { tier: "site", description: "GET /api/v1/site-settings/" },
  )
}

/** Primary site navigation. */
export function useNavigation() {
  const locale = useLanguage().language
  return useCmsQuery<Navigation>(
    cmsKeys.site.navigation(locale),
    () => fetchNavigation({ locale }),
    { tier: "site", description: "GET /api/v1/navigation/" },
  )
}

/** Footer content (columns, socials, company). */
export function useFooter() {
  const locale = useLanguage().language
  return useCmsQuery<Footer>(
    cmsKeys.site.footer(locale),
    () => fetchFooter({ locale }),
    { tier: "site", description: "GET /api/v1/footer/" },
  )
}