import type { Meta, StoryObj } from "@storybook/react"

import { ResponsiveImage } from "./ResponsiveImage"

const meta: Meta<typeof ResponsiveImage> = {
  title: "CMS/ResponsiveImage",
  component: ResponsiveImage,
  tags: ["autodocs"],
  argTypes: {
    src: { control: "text" },
    alt: { control: "text" },
  },
  args: {
    alt: "A sample cover image",
    className: "aspect-video rounded-xl",
  },
}

export default meta
type Story = StoryObj<typeof ResponsiveImage>

export const WithImage: Story = {
  args: { src: "https://picsum.photos/seed/hanahoush/640/360" },
}

export const LazyLoaded: Story = {
  args: { src: "https://picsum.photos/seed/hanahoush2/640/360" },
}

export const FallbackWhenMissing: Story = {
  args: { src: undefined },
}

export const FallbackOnBroken: Story = {
  args: { src: "https://invalid.example/missing.jpg" },
}
