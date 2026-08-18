import type { Meta, StoryObj } from "@storybook/react"

import { AnnouncementBar } from "@/features/page-builder/components/AnnouncementBar"
import type { Announcement } from "@/features/page-builder/types"

const mockAnnouncement: Announcement = {
  is_enabled: true,
  text: "New Hanahoush release is live — explore the latest features.",
  link: "/articles",
  link_label: "Read more",
  dismissible: true,
  background_color: "brand",
  text_color: "white",
  start_at: null,
  end_at: null,
}

const meta: Meta<typeof AnnouncementBar> = {
  title: "PageBuilder/AnnouncementBar",
  component: AnnouncementBar,
  tags: ["autodocs"],
  args: { announcement: mockAnnouncement },
}

export default meta
type Story = StoryObj<typeof AnnouncementBar>

export const Enabled: Story = {}

export const Disabled: Story = {
  args: { announcement: { ...mockAnnouncement, is_enabled: false } },
}

export const WithLinkRemoved: Story = {
  args: { announcement: { ...mockAnnouncement, link: "", link_label: "" } },
}