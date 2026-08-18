import type { Meta, StoryObj } from "@storybook/react"

import { ContactFormSection, ValuesSection } from "@/features/page-builder/registry/sections/company-about"

export default {
  title: "PageBuilder/Sections/Company",
  tags: ["autodocs"],
} satisfies Meta

export const Values: StoryObj = {
  render: () => (
    <ValuesSection
      config={{
        eyebrow: "Values",
        title: "What we believe in.",
        values: [
          { title: "Engineering quality", body: "Code and architecture that lasts — reviewed, tested and documented." },
          { title: "Transparency", body: "Visible progress and honest estimates at every step." },
          { title: "Outcomes", body: "We build things that actually work, not demos that impress." },
        ],
      }}
    />
  ),
}

export const ContactForm: StoryObj = {
  render: () => (
    <ContactFormSection
      config={{
        eyebrow: "Inquiry",
        title: "Write to us about your project.",
        description: "Our team usually responds within one business day.",
      }}
    />
  ),
}