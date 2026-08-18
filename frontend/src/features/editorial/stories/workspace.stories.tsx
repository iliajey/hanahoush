import type { Meta, StoryObj } from "@storybook/react"

import { CommentThread, DiffViewer, AuditTimeline, PublishButton } from "@/features/editorial/components"

export default {
  title: "Editorial/Workspace",
  tags: ["autodocs"],
} satisfies Meta

export const DiffViewerStory: StoryObj = {
  name: "DiffViewer",
  render: () => (
    <DiffViewer
      from={1}
      to={2}
      changes={[
        { field: "title_en", kind: "changed", old: "Old Title", new: "New Title" },
        { field: "is_featured", kind: "added", old: null, new: true },
        { field: "tags", kind: "removed", old: ["django"], new: null },
      ]}
    />
  ),
}

export const CommentThreadStory: StoryObj = {
  name: "CommentThread",
  render: () => (
    <div className="max-w-lg">
      <CommentThread
        comments={[
          {
            id: 1,
            parent: null,
            body: "Please update the intro paragraph.",
            resolved: false,
            resolved_by: null,
            resolved_at: null,
            mentions: [2],
            created_by: { id: 1, username: "editor" },
            created_at: new Date().toISOString(),
            replies: [
              {
                id: 2,
                parent: 1,
                body: "Done — PTAL.",
                resolved: false,
                resolved_by: null,
                resolved_at: null,
                mentions: [],
                created_by: { id: 2, username: "writer" },
                created_at: new Date().toISOString(),
                replies: [],
              },
            ],
          },
        ]}
      />
    </div>
  ),
}

export const AuditTimelineStory: StoryObj = {
  name: "AuditTimeline",
  render: () => (
    <div className="max-w-md">
      <AuditTimeline
        events={[
          { id: 3, action: "workflow.publish", actor: { id: 1, username: "admin" }, old_value: null, new_value: null, details: "", ip_address: "127.0.0.1", created_at: new Date().toISOString() },
          { id: 2, action: "approval.decided", actor: { id: 2, username: "reviewer" }, old_value: null, new_value: null, details: "LGTM", ip_address: "127.0.0.1", created_at: new Date(Date.now() - 3600_000).toISOString() },
          { id: 1, action: "revision.created", actor: { id: 3, username: "editor" }, old_value: null, new_value: null, details: "→ SEO Review", ip_address: "127.0.0.1", created_at: new Date(Date.now() - 7200_000).toISOString() },
        ]}
      />
    </div>
  ),
}

export const PublishButtonStory: StoryObj = {
  name: "PublishButton",
  render: () => <PublishButton />,
}
