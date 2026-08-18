import { lazy } from "react"
import type { ComponentType, LazyExoticComponent } from "react"

import { isKnownSectionType, type SectionType } from "../config"
import type { SectionConfig } from "../types"

export interface SectionProps {
  config: SectionConfig
}

export interface RegisteredSection {
  type: SectionType
  name: string
  description: string
  icon: string
  Component: LazyExoticComponent<ComponentType<SectionProps>>
}

const NAME: Record<SectionType, string> = {
  hero: "Hero",
  statistics: "Statistics",
  services: "Services",
  erp: "ERP (hanRP)",
  projects: "Projects",
  articles: "Articles",
  about: "About",
  team: "Team",
  timeline: "Timeline",
  partners: "Partners",
  testimonials: "Testimonials",
  faq: "FAQ",
  cta: "CTA",
  footer: "Footer",
  journey: "Service Journey",
  comparison: "Comparison",
  stack: "Technology Stack",
  process: "Process",
  featured_projects: "Featured Projects",
  project_filters: "Project Discovery",
  technology_explorer: "Technology Explorer",
  projects_timeline: "Project Timeline",
  case_hero: "Case Study Hero",
  case_challenge: "Case Study Challenge",
  case_objectives: "Case Study Objectives",
  case_solution: "Case Study Solution",
  case_architecture: "Case Study Architecture",
  case_technology: "Case Study Technology",
  case_journey: "Case Study Journey",
  case_gallery: "Case Study Gallery",
  case_results: "Case Study Results",
  case_related_projects: "Case Study Related Projects",
  case_related_articles: "Case Study Related Articles",
  case_cta: "Case Study CTA",
  articles_hero: "Articles Hero",
  featured_article: "Featured Article",
  latest_articles: "Latest Articles",
  article_filters: "Article Discovery",
  category_explorer: "Category Explorer",
  tag_explorer: "Tag Explorer",
  newsletter_cta: "Newsletter CTA",
  article_cta: "Article CTA",
  article_hero: "Article Hero",
  article_content: "Article Content",
  article_related: "Article Related Content",
  company_story: "Company Story",
  values: "Company Values",
  offices: "Offices / Locations",
  social_links: "Social Links",
  contact_form: "Contact Form",
}

const DESCRIPTION: Record<SectionType, string> = {
  hero: "Animated hero with headline, subtitle and CTAs.",
  statistics: "Live counters derived from API content.",
  services: "Published services grid (or curated core services).",
  erp: "hanRP product features and module status.",
  projects: "Featured portfolio projects.",
  articles: "Featured article cards.",
  about: "Mission and vision.",
  team: "Team members.",
  timeline: "Company milestones.",
  partners: "Partner logo marquee.",
  testimonials: "Client quotes.",
  faq: "Accordion FAQ.",
  cta: "Call-to-action band.",
  footer: "Footer columns, socials and company info.",
  journey: "Problem → Solution → Technology → Result storytelling.",
  comparison: "Traditional vs the Hanahoush approach.",
  stack: "Animated technology showcase.",
  process: "Delivery process steps.",
  featured_projects: "Editorial-style featured portfolio.",
  project_filters: "Category / technology / year filters + search.",
  technology_explorer: "Explore projects by technology.",
  projects_timeline: "Portfolio evolution over time.",
  case_hero: "Project title, category, year, technology, hero image.",
  case_challenge: "The problem, who had it and constraints.",
  case_objectives: "Project goals.",
  case_solution: "The Hanahoush approach.",
  case_architecture: "Architecture visualization (CMS-driven).",
  case_technology: "Project technology stack.",
  case_journey: "Implementation stages.",
  case_gallery: "Project gallery with lightbox.",
  case_results: "Outcomes and impact (CMS-driven).",
  case_related_projects: "Projects by category/technology overlap.",
  case_related_articles: "Related articles from the CMS.",
  case_cta: "Final call to action.",
  articles_hero: "Editorial hub heading + search.",
  featured_article: "One dominant editorial article.",
  latest_articles: "Responsive editorial grid.",
  article_filters: "Search / category / tag / sort + grid.",
  category_explorer: "Article categories from the CMS.",
  tag_explorer: "Technical topics from the CMS.",
  newsletter_cta: "Premium newsletter subscription.",
  article_cta: "Contextual call to action.",
  article_hero: "Title, meta, cover for a single article.",
  article_content: "Safe body render + TOC + reading progress.",
  article_related: "Related articles / projects / services.",
  company_story: "Company narrative from the about page.",
  values: "Company values (CMS-configurable).",
  offices: "Physical office locations.",
  social_links: "Social links from the CMS.",
  contact_form: "Production contact / inquiry form.",
}

/** Every section is loaded lazily — only mounted sections are fetched. */
const registry = {
  hero: lazy(() => import("./sections/HeroSection")),
  statistics: lazy(() => import("./sections/StatisticsSection")),
  services: lazy(() => import("./sections/ServicesSection")),
  erp: lazy(() => import("./sections/ERPSection")),
  projects: lazy(() => import("./sections/ProjectsSection")),
  articles: lazy(() => import("./sections/ArticlesSection")),
  about: lazy(() => import("./sections/AboutSection")),
  team: lazy(() => import("./sections/TeamSection")),
  timeline: lazy(() => import("./sections/TimelineSection")),
  partners: lazy(() => import("./sections/PartnersSection")),
  testimonials: lazy(() => import("./sections/TestimonialsSection")),
  faq: lazy(() => import("./sections/FAQSection")),
  cta: lazy(() => import("./sections/CTASection")),
  footer: lazy(() => import("./sections/FooterSection")),
  journey: lazy(() => import("./sections/JourneySection")),
  comparison: lazy(() => import("./sections/ComparisonSection")),
  stack: lazy(() => import("./sections/StackSection")),
  process: lazy(() => import("./sections/ProcessSection")),
  featured_projects: lazy(() => import("./sections/projects-listing").then((m) => ({ default: m.FeaturedProjectsSection }))),
  project_filters: lazy(() => import("./sections/projects-listing").then((m) => ({ default: m.ProjectFiltersSection }))),
  technology_explorer: lazy(() => import("./sections/projects-listing").then((m) => ({ default: m.TechnologyExplorerSection }))),
  projects_timeline: lazy(() => import("./sections/projects-listing").then((m) => ({ default: m.ProjectsTimelineSection }))),
  case_hero: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseHeroSection }))),
  case_challenge: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseChallengeSection }))),
  case_objectives: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseObjectivesSection }))),
  case_solution: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseSolutionSection }))),
  case_architecture: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseArchitectureSection }))),
  case_technology: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseTechnologySection }))),
  case_journey: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseJourneySection }))),
  case_gallery: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseGallerySection }))),
  case_results: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseResultsSection }))),
  case_related_projects: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseRelatedProjectsSection }))),
  case_related_articles: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseRelatedArticlesSection }))),
  case_cta: lazy(() => import("./sections/case-study").then((m) => ({ default: m.CaseCTASection }))),
  articles_hero: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.ArticlesHeroSection }))),
  featured_article: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.FeaturedArticleSection }))),
  latest_articles: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.LatestArticlesSection }))),
  article_filters: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.ArticleFiltersSection }))),
  category_explorer: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.CategoryExplorerSection }))),
  tag_explorer: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.TagExplorerSection }))),
  newsletter_cta: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.NewsletterCTASection }))),
  article_cta: lazy(() => import("./sections/articles-hub").then((m) => ({ default: m.ArticleCTASection }))),
  article_hero: lazy(() => import("./sections/articles-article").then((m) => ({ default: m.ArticleHeroSection }))),
  article_content: lazy(() => import("./sections/articles-article").then((m) => ({ default: m.ArticleContentSection }))),
  article_related: lazy(() => import("./sections/articles-article").then((m) => ({ default: m.ArticleRelatedSection }))),
  company_story: lazy(() => import("./sections/company-about").then((m) => ({ default: m.CompanyStorySection }))),
  values: lazy(() => import("./sections/company-about").then((m) => ({ default: m.ValuesSection }))),
  offices: lazy(() => import("./sections/company-about").then((m) => ({ default: m.OfficesSection }))),
  social_links: lazy(() => import("./sections/company-about").then((m) => ({ default: m.SocialLinksSection }))),
  contact_form: lazy(() => import("./sections/company-about").then((m) => ({ default: m.ContactFormSection }))),
} satisfies Record<SectionType, LazyExoticComponent<ComponentType<SectionProps>>>

export function isRegisteredSection(type: string): type is SectionType {
  return isKnownSectionType(type) && type in registry
}

export function getSectionComponent(type: string): LazyExoticComponent<ComponentType<SectionProps>> | null {
  return isRegisteredSection(type) ? registry[type] : null
}

export function getSectionInfo(type: string): RegisteredSection | null {
  if (!isRegisteredSection(type)) return null
  return { type, name: NAME[type], description: DESCRIPTION[type], icon: type, Component: registry[type] }
}

export function registeredSections(): RegisteredSection[] {
  return (Object.keys(registry) as SectionType[]).map((type) => ({
    type,
    name: NAME[type],
    description: DESCRIPTION[type],
    icon: type,
    Component: registry[type],
  }))
}
