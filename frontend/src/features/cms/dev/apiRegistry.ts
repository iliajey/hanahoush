/** Endpoint registry shown on the /dev/api page. */

export interface ApiEndpointEntry {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  hooks: string[]
}

export const API_ENDPOINTS: ApiEndpointEntry[] = [
  { method: "GET", path: "/api/v1/articles/", description: "Published articles (pagination, filtering, search, ordering)", hooks: ["useArticles", "useFeaturedArticles"] },
  { method: "GET", path: "/api/v1/articles/{id}/", description: "Article detail (includes SEO + OG image)", hooks: ["useArticle"] },
  { method: "GET", path: "/api/v1/projects/", description: "Published projects (pagination, filtering, search, ordering)", hooks: ["useProjects", "useFeaturedProjects"] },
  { method: "GET", path: "/api/v1/projects/{id}/", description: "Project detail (includes gallery + technologies)", hooks: ["useProject"] },
  { method: "GET", path: "/api/v1/services/", description: "Published services (section / featured filters)", hooks: ["useServices"] },
  { method: "GET", path: "/api/v1/services/{id}/", description: "Service detail", hooks: ["useService"] },
  { method: "GET", path: "/api/v1/service-sections/", description: "Service section groupings (with published counts)", hooks: ["useServiceSections"] },
  { method: "GET", path: "/api/v1/about/", description: "About page (mission, vision)", hooks: ["useAbout"] },
  { method: "GET", path: "/api/v1/team/", description: "Team members", hooks: ["useTeam"] },
  { method: "GET", path: "/api/v1/partners/", description: "Partner list", hooks: ["usePartners"] },
  { method: "GET", path: "/api/v1/testimonials/", description: "Testimonials (is_featured filter)", hooks: ["useTestimonials"] },
  { method: "GET", path: "/api/v1/faqs/", description: "FAQ entries (category / featured filters, search)", hooks: ["useFAQs"] },
  { method: "GET", path: "/api/v1/timeline/", description: "Company milestones", hooks: ["useTimeline"] },
  { method: "GET", path: "/api/v1/social-links/", description: "Social links", hooks: ["useSocialLinks"] },
  { method: "GET", path: "/api/v1/offices/", description: "Offices (contact)", hooks: ["useOffices"] },
  { method: "GET", path: "/api/v1/site-settings/", description: "Site-wide settings singleton", hooks: ["useSiteSettings"] },
  { method: "GET", path: "/api/v1/navigation/", description: "Primary navigation (localized)", hooks: ["useNavigation"] },
  { method: "GET", path: "/api/v1/footer/", description: "Footer columns, socials, company info", hooks: ["useFooter"] },
  { method: "POST", path: "/api/v1/auth/login/", description: "Authentication (login)", hooks: ["useLogin"] },
  { method: "GET", path: "/api/v1/auth/me/", description: "Current user", hooks: ["useUser"] },
]

export function resolveEndpoint(path: string, id = 1): string {
  return path.replace("{id}", String(id))
}
