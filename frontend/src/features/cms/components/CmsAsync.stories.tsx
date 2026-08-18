import type { Meta, StoryObj } from "@storybook/react"

import { CmsAsync, CmsSectionSkeleton, CmsEmpty } from "./CmsAsync"

const meta: Meta<typeof CmsAsync> = {
  title: "CMS/CmsAsync",
  component: CmsAsync,
  tags: ["autodocs"],
  args: {
    isLoading: false,
    isError: false,
    isEmpty: false,
    children: <div className="rounded-2xl border bg-card p-6">Content loaded from the API.</div>,
  },
}

export default meta
type Story = StoryObj<typeof CmsAsync>

export const Success: Story = {}

export const Loading: Story = { args: { isLoading: true, children: undefined } }

export const ErrorState: Story = {
  args: { isError: true, error: new Error("Connection refused") },
}

export const Empty: Story = {
  args: { isEmpty: true },
}

export const LoadingWithCustomSkeleton: Story = {
  args: {
    isLoading: true,
    skeleton: <CmsSectionSkeleton />,
  },
}

export const DefaultEmptyState: Story = {
  render: () => <CmsEmpty />,
}
