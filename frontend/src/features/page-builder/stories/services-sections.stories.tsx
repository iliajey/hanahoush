import type { Meta, StoryObj } from "@storybook/react"

import JourneySection from "@/features/page-builder/registry/sections/JourneySection"
import ComparisonSection from "@/features/page-builder/registry/sections/ComparisonSection"
import StackSection from "@/features/page-builder/registry/sections/StackSection"
import ProcessSection from "@/features/page-builder/registry/sections/ProcessSection"
import ServicesSection from "@/features/page-builder/registry/sections/ServicesSection"

export default {
  title: "PageBuilder/Sections/Services",
  tags: ["autodocs"],
} satisfies Meta

export const Journey: StoryObj = {
  render: () => (
    <JourneySection
      config={{
        eyebrow: "The journey",
        title: "From problem to result.",
        steps: [
          { key: "problem", icon: "alert", title: "Problem", body: "We analyse your business to find the root problem." },
          { key: "solution", icon: "lightbulb", title: "Solution", body: "We design an architecture and roadmap matched to your scale." },
          { key: "technology", icon: "cpu", title: "Technology", body: "We choose proven, fit-for-purpose technology." },
          { key: "result", icon: "trending", title: "Result", body: "Delivery you can measure — faster and more reliable." },
        ],
      }}
    />
  ),
}

export const Comparison: StoryObj = {
  render: () => (
    <ComparisonSection
      config={{
        title: "Traditional vs the Hanahoush approach.",
        columns: [{ label: "Traditional" }, { label: "Hanahoush" }],
        rows: [
          { factor: "Architecture", traditional: "Monolithic", hanahoush: "Modular and scalable" },
          { factor: "Time to market", traditional: "Months", hanahoush: "Agile sprints, weekly demos" },
        ],
      }}
    />
  ),
}

export const Stack: StoryObj = {
  render: () => (
    <StackSection
      config={{
        title: "Technologies we build with.",
        technologies: ["Python", "Django", "React", "TypeScript", "PostgreSQL", "Redis", "Kubernetes", "Odoo"],
      }}
    />
  ),
}

export const Process: StoryObj = {
  render: () => (
    <ProcessSection
      config={{
        title: "A transparent process.",
        steps: ["Discovery", "Planning", "Architecture", "Development", "Testing", "Deployment", "Support"],
      }}
    />
  ),
}

export const CoreServicesCurated: StoryObj = {
  name: "CoreServices (curated)",
  render: () => (
    <ServicesSection
      config={{
        title: "Core services.",
        items: [
          { icon: "code", title: "Software Development", description: "Custom enterprise applications.", tags: ["Python", "Django", "React"] },
          { icon: "layers", title: "ERP", description: "Enterprise resource planning.", tags: ["hanRP", "Finance", "HR"] },
          { icon: "cpu", title: "hanRP", description: "Our own ERP product.", tags: ["Modular", "Bilingual"] },
        ],
      }}
    />
  ),
}
