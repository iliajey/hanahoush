/**
 * Page Builder — Enterprise Dynamic Page Composition Engine.
 *
 * Pages are assembled at runtime from backend configuration: the registry
 * maps section types to lazy components, and `<PageRenderer />` composes a
 * page from its ordered, enabled sections.
 */
export * from "./api"
export * from "./hooks"
export * from "./config"
export * from "./components"
export { PageRenderer, UnknownSectionFallback, SectionSkeleton } from "./renderer"
export {
  getSectionComponent,
  getSectionInfo,
  isRegisteredSection,
  registeredSections,
} from "./registry"
export type { RegisteredSection, SectionProps } from "./registry"
export type {
  Page,
  PageSection,
  PageSEO,
  PageSummary,
  PageBuilderRegistry,
  SectionTypeInfo,
  Announcement,
  HeroConfig,
  SectionConfig,
  SectionRenderRecord,
} from "./types"
