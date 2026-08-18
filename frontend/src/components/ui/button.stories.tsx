import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "link", "destructive"],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    asChild: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } }

export const Outline: Story = { args: { variant: "outline", children: "Outline" } }

export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } }

export const Link: Story = { args: { variant: "link", children: "Link" } }

export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } }

export const Small: Story = { args: { size: "sm", children: "Small" } }

export const Large: Story = { args: { size: "lg", children: "Large" } }

export const Disabled: Story = { args: { disabled: true, children: "Disabled" } }
