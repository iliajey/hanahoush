import { useArticles } from "../hooks/useArticles"
import { usePartners } from "../hooks/usePartnersTestimonials"
import { useProjects } from "../hooks/useProjects"
import { useTeam } from "../hooks/useCompany"

export interface SiteStat {
  key: "projects" | "articles" | "team" | "partners"
  value: number
}

/**
 * Derive the homepage statistics block from real CMS data (no hardcoded
 * numbers): project & article totals come from API pagination metadata,
 * team size and partner counts come from their lists.
 */
export function useSiteStats(): { stats: SiteStat[]; isLoading: boolean } {
  const projects = useProjects({ pageSize: 1 })
  const articles = useArticles({ pageSize: 1 })
  const team = useTeam()
  const partners = usePartners()

  const stats: SiteStat[] = [
    { key: "projects", value: projects.data?.pagination?.count ?? 0 },
    { key: "articles", value: articles.data?.pagination?.count ?? 0 },
    { key: "team", value: team.data?.length ?? 0 },
    { key: "partners", value: partners.data?.length ?? 0 },
  ]

  const isLoading =
    projects.isLoading || articles.isLoading || team.isLoading || partners.isLoading

  return { stats, isLoading }
}