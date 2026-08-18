import type { Footer, Navigation, SiteSettings } from "../types"

import { cmsGet, type CmsRequestOptions } from "./client"

export async function fetchSiteSettings(options: CmsRequestOptions): Promise<SiteSettings> {
  return cmsGet<SiteSettings>("/site-settings", options)
}

export async function fetchNavigation(options: CmsRequestOptions): Promise<Navigation> {
  return cmsGet<Navigation>("/navigation", options)
}

export async function fetchFooter(options: CmsRequestOptions): Promise<Footer> {
  return cmsGet<Footer>("/footer", options)
}