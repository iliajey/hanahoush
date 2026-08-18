import type { Meta, StoryObj } from "@storybook/react"

import { Alert, AlertDescription, AlertTitle } from "./alert"

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "info", "destructive", "success", "warning"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Info: Story = {
  args: { variant: "info" },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>This is an informational alert.</AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  args: { variant: "success" },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your changes were saved.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  args: { variant: "warning" },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>This action cannot be undone.</AlertDescription>
    </Alert>
  ),
}
