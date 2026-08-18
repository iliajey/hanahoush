import type { Meta, StoryObj } from "@storybook/react"

import { ApprovalStatus, LockIndicator, RevisionCard, WorkflowBadge } from "@/features/editorial/components"

const stages = ["draft", "in_review", "seo_review", "approved", "scheduled", "published", "archived"] as const

export default {
  title: "Editorial/Status",
  tags: ["autodocs"],
} satisfies Meta

export const WorkflowBadges: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {stages.map((code) => (
        <WorkflowBadge key={code} stageCode={code} stageName={code.replace("_", " ")} />
      ))}
    </div>
  ),
}

export const ApprovalStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ApprovalStatus status="pending" />
      <ApprovalStatus status="approved" />
      <ApprovalStatus status="rejected" />
    </div>
  ),
}

const revision = {
  id: 1,
  version: 3,
  summary: "→ SEO Review",
  data: {},
  created_by: { id: 7, username: "editor" },
  created_at: new Date().toISOString(),
}

export const RevisionCardStory: StoryObj = {
  name: "RevisionCard",
  render: () => (
    <div className="max-w-md space-y-3">
      <RevisionCard revision={revision} isLatest />
      <RevisionCard revision={{ ...revision, version: 2 }} />
    </div>
  ),
}

export const LockIndicatorStory: StoryObj = {
  name: "LockIndicator",
  render: () => (
    <div className="max-w-md space-y-3">
      <LockIndicator
        lock={{
          id: 1,
          content_label: "Article",
          locked_by: { id: 1, username: "alice" },
          expires_at: new Date(Date.now() + 12 * 60000).toISOString(),
          note: "",
          created_at: new Date().toISOString(),
        }}
      />
      <LockIndicator lock={null} />
    </div>
  ),
}