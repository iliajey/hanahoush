import { useLanguage } from "@/app/language/useLanguage"
import { useCmsQuery } from "@/features/cms/hooks/useCmsQuery"
import type { QueryClient } from "@tanstack/react-query"

import {
  fetchAnnouncement,
  fetchHeroConfig,
  fetchPage,
  fetchPageBuilderRegistry,
  fetchPageList,
  fetchSEO,
} from "../api"
import type { Announcement, HeroConfig, Page, PageBuilderRegistry, PageSEO, PageSummary } from "../types"

export const pbKeys = {
  all: ["page-builder"] as const,
  page: (locale: string, slug: string) => ["page-builder", "page", locale, slug] as const,
  pages: (locale: string) => ["page-builder", "pages", locale] as const,
  registry: (locale: string) => ["page-builder", "registry", locale] as const,
  announcement: (locale: string) => ["page-builder", "announcement", locale] as const,
  seo: (locale: string, slug?: string) => ["page-builder", "seo", locale, slug ?? "default"] as const,
  hero: (locale: string) => ["page-builder", "hero", locale] as const,
}

/** Invalidate every cached page-builder query (all locales). */
export function invalidatePageBuilderCache(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ["page-builder"] })
}

/** Composed page (published) — the dynamic layout for a route. */
export function usePage(slug: string) {
  const locale = useLanguage().language
  return useCmsQuery<Page>(
    pbKeys.page(locale, slug),
    () => fetchPage(slug, { locale }),
    { tier: "content", description: `GET /api/v1/pages/${slug}/` },
  )
}

/** Published page index (for the dev console). */
export function usePageList() {
  const locale = useLanguage().language
  return useCmsQuery<PageSummary[]>(
    pbKeys.pages(locale),
    () => fetchPageList({ locale }),
    { tier: "content", description: "GET /api/v1/pages/" },
  )
}

/** Section registry + page index. */
export function usePageBuilderRegistry() {
  const locale = useLanguage().language
  return useCmsQuery<PageBuilderRegistry>(
    pbKeys.registry(locale),
    () => fetchPageBuilderRegistry({ locale }),
    { tier: "content", description: "GET /api/v1/page-builder/" },
  )
}

/** Announcement bar. */
export function useAnnouncement() {
  const locale = useLanguage().language
  return useCmsQuery<Announcement>(
    pbKeys.announcement(locale),
    () => fetchAnnouncement({ locale }),
    { tier: "site", description: "GET /api/v1/announcement/" },
  )
}

/** SEO for a page (or the site default). */
export function useSEO(slug?: string) {
  const locale = useLanguage().language
  return useCmsQuery<PageSEO>(
    pbKeys.seo(locale, slug),
    () => fetchSEO(slug, { locale }),
    { tier: "site", description: "GET /api/v1/seo/" },
  )
}

/** Default hero configuration. */
export function useHeroConfig() {
  const locale = useLanguage().language
  return useCmsQuery<HeroConfig>(
    pbKeys.hero(locale),
    () => fetchHeroConfig({ locale }),
    { tier: "content", description: "GET /api/v1/hero/" },
  )
}
