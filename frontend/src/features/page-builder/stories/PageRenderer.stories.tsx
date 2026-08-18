import type { Meta, StoryObj } from "@storybook/react"

import { PageRenderer } from "@/features/page-builder/renderer"
import { UnknownSectionFallback, SectionSkeleton } from "@/features/page-builder/renderer"
import type { Page } from "@/features/page-builder/types"

const samplePage: Page = {
  id: 1,
  slug: "home",
  title: "Home",
  status: "published",
  is_home: true,
  template: "default",
  version: 1,
  sections_count: 4,
  total_sections: 5,
  sections: [
    {
      id: 1,
      type: "hero",
      title: null,
      is_enabled: true,
      order: 1,
      config: {
        align: "center",
        primary: { label: "Start a project", href: "/contact" },
        secondary: { label: "Explore services", href: "/services" },
      },
    },
    {
      id: 2,
      type: "erp",
      title: null,
      is_enabled: true,
      order: 2,
      config: {
        eyebrow: "hanRP",
        title: "Enterprise Resource Planning, built by Hanahoush.",
        features: [
          { title: "Modular Architecture", description: "Pick the modules you need.", icon: "cpu" },
          { title: "Real-time Analytics", description: "Drill down from KPIs to records.", icon: "chart" },
        ],
        modules: [
          { name: "Finance", status: "live" },
          { name: "Procurement", status: "live" },
          { name: "CRM", status: "soon" },
        ],
      },
    },
    {
      id: 3,
      type: "cta",
      title: null,
      is_enabled: true,
      order: 3,
      config: {
        title: "Ready to build something exceptional?",
        description: "Our engineering team is ready to discuss your project.",
        primary: { label: "Start a project", href: "/contact" },
        secondary: { label: "Talk to engineering", href: "/contact" },
      },
    },
    {
      id: 4,
      type: "mystery-section",
      title: null,
      is_enabled: true,
      order: 4,
      config: {},
    },
  ],
}

const meta: Meta<typeof PageRenderer> = {
  title: "PageBuilder/PageRenderer",
  component: PageRenderer,
  tags: ["autodocs"],
  args: { page: samplePage },
}

export default meta
type Story = StoryObj<typeof PageRenderer>

/** Composes a full page from backend section configuration (lazy loaded). */
export const ComposedPage: Story = {}

/** Only the unknown-section fallback. */
export const UnknownSectionsOnly: Story = {
  args: {
    page: {
      ...samplePage,
      sections: [{ id: 9, type: "custom-thing", title: null, is_enabled: true, order: 1, config: {} }],
    },
  },
}

/** Loading skeleton used while lazy chunks load. */
export const Skeleton: Story = {
  render: () => <SectionSkeleton />,
}

export const UnknownFallback: Story = {
  render: () => <UnknownSectionFallback type="custom-thing" />,
}
