import { useEffect } from "react"

import type { Locale } from "../types"

export interface SeoInput {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: string
  robots?: string
  /** Optional explicit locale subtag overrides the active language. */
  localeHint?: string
  /**
   * Optional hreflang alternates (e.g. { en: "/about", fa: "/about?lang=fa" }).
   * Only emitted when provided — the site has no locale-prefixed routes, so
   * pages that present all languages at one URL should leave this empty.
   */
  alternates?: Record<string, string>
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function removeMeta(attr: "name" | "property", key: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.remove()
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", rel)
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

/**
 * Replace every <link rel="alternate"> with the given hreflang entries while
 * keeping an x-default self reference so the alternate set is well-formed.
 */
function setAlternates(entries: [string, string][], canonical: string) {
  document.head
    .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove())
  const links: [string, string][] = entries
  if (entries.length > 0) {
    links.push(["x-default", canonical])
  }
  links.forEach(([hreflang, href]) => {
    const el = document.createElement("link")
    el.setAttribute("rel", "alternate")
    el.setAttribute("hreflang", hreflang)
    el.setAttribute("href", href)
    document.head.appendChild(el)
  })
}

/**
 * Client-side SEO manager: updates <title>, meta description/keywords,
 * canonical <link>, robots, OpenGraph and Twitter cards from CMS content or
 * site settings. Falls back to a base title/description when no content is
 * present yet.
 */
export function useSeoMeta(
  seo: SeoInput | null | undefined,
  locale: Locale,
  base?: SeoInput,
): void {
  useEffect(() => {
    const meta = base
    const title = seo?.title || meta?.title || "Hanahoush"
    const description = seo?.description || meta?.description || ""
    const canonical = seo?.canonicalUrl || meta?.canonicalUrl || window.location.origin + window.location.pathname
    const ogImage = seo?.ogImage || meta?.ogImage || ""
    const ogType = seo?.ogType || meta?.ogType || "website"
    const robots = seo?.robots || meta?.robots || "index,follow"
    const localeHint = seo?.localeHint || meta?.localeHint || locale

    document.title = title
    upsertMeta("name", "description", description)
    if (seo?.keywords || meta?.keywords) upsertMeta("name", "keywords", seo?.keywords || meta?.keywords || "")
    upsertMeta("name", "robots", robots)

    upsertLink("canonical", canonical)
    upsertMeta("property", "og:site_name", "Hanahoush")
    upsertMeta("property", "og:title", title)
    upsertMeta("property", "og:description", description)
    upsertMeta("property", "og:type", ogType)
    upsertMeta("property", "og:url", canonical)
    upsertMeta("property", "og:locale", localeHint)
    if (ogImage) upsertMeta("property", "og:image", ogImage)

    upsertMeta("name", "twitter:card", "summary_large_image")
    upsertMeta("name", "twitter:title", title)
    upsertMeta("name", "twitter:description", description)
    if (ogImage) upsertMeta("name", "twitter:image", ogImage)

    // Keep a stale noindex from leaking onto an indexable page.
    if (robots.includes("noindex")) upsertMeta("name", "googlebot", robots)
    else removeMeta("name", "googlebot")

    // Hreflang alternates (only when explicitly provided).
    const alternateEntries = Object.entries(seo?.alternates ?? meta?.alternates ?? {})
    setAlternates(alternateEntries, canonical)
  }, [seo, locale, base])
}