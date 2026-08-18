import type { Footer, FooterColumn, FooterLink, SiteSettings } from "../types"

/** View model consumed by the EnterpriseFooter component. */
export interface FooterLinkView {
  label: string
  href: string
}

export interface FooterColumnView {
  title: string
  links: FooterLinkView[]
}

export interface FooterSocialView {
  label: string
  href: string
  platform: string
}

export interface FooterCompanyView {
  name: string
  year: number
}

export interface FooterView {
  columns: FooterColumnView[]
  socials: FooterSocialView[]
  company?: FooterCompanyView
}

/** Map a footer link into an EnterpriseFooter-compatible link. */
export function mapFooterLink(link: FooterLink): FooterLinkView {
  return { label: link.label, href: link.href }
}

export function mapFooterColumn(column: FooterColumn): FooterColumnView {
  return { title: column.title, links: column.links.map(mapFooterLink) }
}

export function mapFooter(footer: Footer): FooterView {
  return {
    columns: footer.columns.map(mapFooterColumn),
    socials: footer.socials.map((social) => ({
      label: social.label,
      href: social.url,
      platform: social.platform,
    })),
    company: footer.company
      ? { name: footer.company.name, year: footer.company.year }
      : undefined,
  }
}

/** Serialize a SiteSettings tagline (localized already by the API). */
export function mapSiteSettings(settings: SiteSettings): SiteSettings {
  return settings
}
