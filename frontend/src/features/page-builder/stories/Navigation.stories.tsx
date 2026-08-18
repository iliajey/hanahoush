import type { Meta, StoryObj } from "@storybook/react"

import { PageNavigation } from "@/features/page-builder/components/Navigation"

const meta: Meta<typeof PageNavigation> = {
  title: "PageBuilder/Navigation",
  component: PageNavigation,
  tags: ["autodocs"],
  args: {
    brand: "Hanahoush",
    items: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
      { label: "Projects", href: "/projects" },
      { label: "Articles", href: "/articles" },
      { label: "About", href: "/about" },
    ],
    cta: { label: "Start a project", href: "/contact" },
  },
}

export default meta
type Story = StoryObj<typeof PageNavigation>

export const Default: Story = {}

export const WithoutCta: Story = { args: { cta: null } }

export const WithFewItems: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
    ],
  },
}