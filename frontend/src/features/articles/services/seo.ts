import { useEffect } from "react"

import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import { isValidJsonLd } from "./content"
import type { ArticleDetail } from "../types"

function setMeta(name: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("name", name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function injectJsonLd(id: string, data: Record<string, unknown>): void {
  useEffect(() => {
    if (!isValidJsonLd(data)) return
    document.getElementById(id)?.remove()
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = id
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      document.getElementById(id)?.remove()
    }
  }, [id, JSON.stringify(data)])
}

/** Article-level SEO: title/description/canonical/OG/twitter + structured data. */
export function useArticleSeo({ article, slug }: { article?: ArticleDetail | null; slug: string }): void {
  const { language } = useLanguage()
  const title =
    (language === "fa" && article?.title_fa) ||
    (language === "ar" && article?.title_ar) ||
    article?.title_en ||
    `Article — ${slug}`
  const description =
    (language === "fa" && article?.short_description_fa) ||
    (language === "ar" && article?.short_description_ar) ||
    article?.short_description_en ||
    ""
  const url = typeof window !== "undefined" ? `${window.location.origin}/articles/${slug}` : undefined

  useSeoMeta(
    {
      title,
      description: description || undefined,
      canonicalUrl: url,
      ogImage: article?.cover_image?.file,
      ogType: "article",
    },
    language,
    { title: "Hanahoush — Articles" },
  )

  // Twitter metadata (where supported).
  useEffect(() => {
    setMeta("twitter:card", "summary_large_image")
    setMeta("twitter:title", title.slice(0, 70))
    if (description) setMeta("twitter:description", description.slice(0, 200))
    if (article?.cover_image?.file) setMeta("twitter:image", article.cover_image.file)
  }, [title, description, article?.cover_image?.file])

  const category = article?.category?.title_en
  const published = article?.published_at
  const modified = article?.updated_at || article?.published_at

  injectJsonLd("article-blogposting-ld", {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description || undefined,
    image: article?.cover_image?.file || undefined,
    url,
    datePublished: published || undefined,
    dateModified: modified || undefined,
    author: article?.author ? { "@type": "Person", name: article.author } : undefined,
    articleSection: category || undefined,
    keywords: (article?.tags ?? []).map((tag) => tag.title_en).join(", ") || undefined,
    inLanguage: ["fa", "en", "ar"],
    publisher: { "@type": "Organization", name: "Hanahoush" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Articles", item: `${typeof window !== "undefined" ? window.location.origin : ""}/articles` },
        { "@type": "ListItem", position: 2, name: title },
      ],
    },
  })
}