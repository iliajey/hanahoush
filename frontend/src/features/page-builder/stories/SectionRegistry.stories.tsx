import type { Meta, StoryObj } from "@storybook/react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { registeredSections } from "@/features/page-builder/registry"

/** Visual documentation of the section registry (all registered section types). */
function SectionRegistryPreview() {
  const sections = registeredSections()
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Card key={section.type}>
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{section.type}</Badge>
            </div>
            <h3 className="font-semibold">{section.name}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const meta: Meta = {
  title: "PageBuilder/SectionRegistry",
  component: SectionRegistryPreview,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj

export const AllRegisteredSections: Story = {}

export const CustomGrid: Story = {
  render: () => (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">All 14 section types registered for dynamic composition.</p>
      <SectionRegistryPreview />
    </div>
  ),
}
