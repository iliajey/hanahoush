import { describe, expect, it } from "vitest"

import {
  mapArticle,
  mapArticles,
  mapFAQ,
  mapFAQs,
  mapFooter,
  mapPartner,
  mapPartners,
  mapProject,
  mapService,
  mapTestimonial,
  mapTimeline,
} from "@/features/cms/mappers"
import type { Article, Footer, Project, Service, TimelineEntry } from "@/features/cms/types"

const article: Article = {
  id: 1,
  title_fa: "عنوان فارسی",
  title_en: "English Title",
  title: "English Title",
  slug: "english-title",
  short_description: "A short summary here.",
  description_en: "Full body with several words to estimate reading time properly.",
  category: { id: 1, title_fa: "فناوری", title_en: "Technology", slug: "technology" },
  tags: [],
  author: null,
  cover_image: { id: 1, file: "/media/cover.jpg", alt_text_en: "cover" },
  status: "published",
  is_featured: true,
  is_public: true,
  published_at: "2025-01-15T10:00:00Z",
  sort_order: 0,
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z",
}

describe("article mapper", () => {
  it("maps localized title and image", () => {
    const view = mapArticle(article, "en")
    expect(view.title).toBe("English Title")
    expect(view.image).toBe("/media/cover.jpg")
    expect(view.category).toBe("Technology")
    expect(view.featured).toBe(true)
  })

  it("maps the whole list", () => {
    expect(mapArticles([article], "en")).toHaveLength(1)
  })
})

describe("project mapper", () => {
  const project: Project = {
    ...article,
    technologies: [{ id: 1, title_en: "Django", slug: "django" }],
    client: "Acme",
    cover_image: null,
  }

  it("flattens technology tags and client", () => {
    const view = mapProject(project, "en")
    expect(view.tags).toContain("Django")
    expect(view.client).toBe("Acme")
  })
})

describe("service mapper", () => {
  const service: Service = {
    ...article,
    section: null,
    icon: "globe",
  }

  it("keeps icon key and href", () => {
    const view = mapService(service, "en")
    expect(view.iconKey).toBe("globe")
    expect(view.href).toBe("/services")
  })
})

describe("company mappers", () => {
  it("maps FAQ", () => {
    expect(mapFAQ({ id: 1, question: "Q", answer: "A" })).toEqual({ question: "Q", answer: "A" })
    expect(mapFAQs([{ id: 1, question: "Q", answer: "A" }])).toHaveLength(1)
  })

  it("maps testimonial with default rating", () => {
    const view = mapTestimonial({
      id: 1,
      author_name: "Ali",
      author_role: "CTO",
      company: "Acme",
      content: "Great",
      rating: 0,
      avatar: null,
      is_featured: true,
    })
    expect(view.rating).toBe(5)
    expect(view.name).toBe("Ali")
  })

  it("maps partner with logo src fallback", () => {
    const partner = { id: 1, name: "Arya", description: "d", logo: null, sort_order: 0 }
    expect(mapPartner(partner)).toEqual({ name: "Arya", src: "" })
    expect(mapPartners([partner])).toHaveLength(1)
  })

  it("maps timeline entry", () => {
    const entry: TimelineEntry = { id: 1, title: "Founded", content: "Start", date: "2017-01-01" }
    const view = mapTimeline(entry, "en")
    expect(view.title).toBe("Founded")
    expect(view.date).toContain("2017")
  })
})

describe("footer mapper", () => {
  const footer: Footer = {
    columns: [
      { title: "Company", links: [{ label: "About", href: "/about" }] },
    ],
    socials: [{ id: 1, platform: "linkedin", label: "LinkedIn", url: "https://in.example" }],
    company: { name: "Hanahoush", year: 2025, tagline: "T", contact_email: "", contact_phone: "" },
  }

  it("maps columns, socials and company", () => {
    const view = mapFooter(footer)
    expect(view.columns[0].links[0].label).toBe("About")
    expect(view.socials[0].platform).toBe("linkedin")
    expect(view.company?.name).toBe("Hanahoush")
  })
})
