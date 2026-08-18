import { cmsGet, cmsList, type CmsRequestOptions } from "@/features/cms/api/client"
import type { Locale } from "@/features/cms/types"

import type { Announcement, HeroConfig, Page, PageBuilderRegistry, PageSEO, PageSummary } from "../types"

/** Composed page (published, by slug). */
export async function fetchPage(slug: string, options: CmsRequestOptions): Promise<Page> {
  return cmsGet<Page>(`/pages/${slug}/`, options)
}

/** Published page index. */
export async function fetchPageList(options: CmsRequestOptions): Promise<Array<PageSummary>> {
  const result = await cmsList<PageSummary>("/pages", { ...options, params: { page_size: 100 } })
  return result.items
}

/** Section registry + page index (drives the /dev/page-builder console). */
export async function fetchPageBuilderRegistry(options: CmsRequestOptions): Promise<PageBuilderRegistry> {
  return cmsGet<PageBuilderRegistry>("/page-builder", options)
}

/** Announcement bar. */
export async function fetchAnnouncement(options: CmsRequestOptions): Promise<Announcement> {
  return cmsGet<Announcement>("/announcement", options)
}

/** SEO configuration (per page slug or site default). */
export async function fetchSEO(slug: string | undefined, options: CmsRequestOptions): Promise<PageSEO> {
  const query = slug ? `?slug=${encodeURIComponent(slug)}` : ""
  return cmsGet<PageSEO>(`/seo/${query}`, options)
}

/** Default hero configuration. */
export async function fetchHeroConfig(options: CmsRequestOptions): Promise<HeroConfig> {
  return cmsGet<HeroConfig>("/hero", options)
}

export type { Locale }
