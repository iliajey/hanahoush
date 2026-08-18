import { useEffect } from "react"

import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import type { ProjectCaseStudy } from "../types"

/** Inject a BreadcrumbList + CreativeWork JSON-LD script block. */
function injectJsonLd(id: string, data: Record<string, unknown>): void {
  useEffect(() => {
    const existing = document.getElementById(id)
    existing?.remove()
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

/** Project-level SEO: title/description/canonical/OG + structured data. */
export function useProjectSeo({ project, slug }: { project?: ProjectCaseStudy | null; slug: string }): void {
  const { language } = useLanguage()
  const title =
    (language === "fa" && project?.title_fa) ||
    (language === "ar" && project?.title_ar) ||
    project?.title ||
    project?.title_en ||
    `Project — ${slug}`
  const description =
    (language === "fa" && project?.short_description_fa) ||
    (language === "ar" && project?.short_description_ar) ||
    project?.short_description ||
    project?.description ||
    ""

  useSeoMeta(
    {
      title,
      description: description || undefined,
      canonicalUrl: typeof window !== "undefined" ? `${window.location.origin}/projects/${project?.slug ?? slug}` : undefined,
      ogImage: project?.cover_image?.file,
      ogType: "article",
    },
    language,
    { title: "Hanahoush — Projects" },
  )

  injectJsonLd("project-case-study-ld", {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: description || undefined,
    url: typeof window !== "undefined" ? `${window.location.origin}/projects/${slug}` : undefined,
    inLanguage: ["fa", "en", "ar"],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Projects",
          item: `${typeof window !== "undefined" ? window.location.origin : ""}/projects`,
        },
        { "@type": "ListItem", position: 2, name: title },
      ],
    },
  })
}