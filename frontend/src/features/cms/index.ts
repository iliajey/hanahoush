/**
 * CMS Integration Layer — feature barrel.
 *
 * Connects the frontend to the Django CMS API. Everything is
 * query-driven: hooks expose React Query state, mappers normalize API
 * payloads to view models, and the cache module centralizes the policy.
 */
export * from "./api"
export * from "./hooks"
export * from "./mappers"
export * from "./services"
export * from "./cache"
export * from "./components"
export * from "./seo"
export { cmsKeys } from "./queries/keys"
export type {
  Article,
  Project,
  Service,
  About,
  TeamMember,
  Partner,
  Testimonial,
  FAQEntry,
  TimelineEntry,
  SocialLink,
  Office,
  SiteSettings,
  Navigation,
  Footer,
  MediaRef,
  Paginated,
  ListParams,
  Locale,
} from "./types"
