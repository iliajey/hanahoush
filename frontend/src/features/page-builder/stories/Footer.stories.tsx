import type { Meta, StoryObj } from "@storybook/react"
import { Github, Linkedin } from "lucide-react"

import { EnterpriseFooter } from "@/components/marketing/footer"

const meta: Meta<typeof EnterpriseFooter> = {
  title: "PageBuilder/Footer",
  component: EnterpriseFooter,
  tags: ["autodocs"],
  args: {
    columns: [
      { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Projects", href: "/projects" }, { label: "Contact", href: "/contact" }] },
      { title: "Services", links: [{ label: "Web Development", href: "/services" }, { label: "ERP Consulting", href: "/services" }, { label: "AI", href: "/services" }] },
      { title: "Resources", links: [{ label: "FAQ", href: "/faq" }, { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
    ],
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/company/hanahoush", icon: <Linkedin className="h-4 w-4" /> },
      { label: "GitHub", href: "https://github.com/hanahoush", icon: <Github className="h-4 w-4" /> },
    ],
    company: { name: "Hanahoush", year: 2026 },
  },
}

export default meta
type Story = StoryObj<typeof EnterpriseFooter>

export const Default: Story = {}

export const WithNewsletter: Story = {
  args: {
    newsletter: { placeholder: "you@company.com", onSubmit: () => {} },
  },
}
