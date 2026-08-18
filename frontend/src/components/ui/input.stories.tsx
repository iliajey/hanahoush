import type { Meta, StoryObj } from "@storybook/react"

import { Input } from "./input"
import { Label } from "./label"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    placeholder: "Type something…",
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="you@hanahoush.local" />
    </div>
  ),
}

export const Error: Story = { args: { error: true, placeholder: "Invalid value" } }

export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } }
