import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ApprovalStatus, DiffViewer, LockIndicator, WorkflowBadge } from "@/features/editorial/components"

describe("WorkflowBadge", () => {
  it("renders the stage name", () => {
    render(<WorkflowBadge stageCode="in_review" stageName="In Review" />)
    expect(screen.getByText("In Review")).toBeInTheDocument()
  })
})

describe("ApprovalStatus", () => {
  it("labels each decision status", () => {
    const { rerender } = render(<ApprovalStatus status="pending" />)
    expect(screen.getByText("Pending")).toBeInTheDocument()
    rerender(<ApprovalStatus status="approved" />)
    expect(screen.getByText("Approved")).toBeInTheDocument()
    rerender(<ApprovalStatus status="rejected" />)
    expect(screen.getByText("Rejected")).toBeInTheDocument()
  })
})

describe("DiffViewer", () => {
  const changes = [
    { field: "title_en", kind: "changed" as const, old: "Old Title", new: "New Title" },
    { field: "is_featured", kind: "added" as const, old: null, new: true },
  ]

  it("renders changed and added fields", () => {
    render(<DiffViewer changes={changes} from={1} to={2} />)
    expect(screen.getByText("title_en")).toBeInTheDocument()
    expect(screen.getByText("is_featured")).toBeInTheDocument()
    expect(screen.getByText("Old Title")).toBeInTheDocument()
    expect(screen.getByText("New Title")).toBeInTheDocument()
    expect(screen.getByText("2 field(s) changed")).toBeInTheDocument()
  })

  it("renders an empty message when nothing changed", () => {
    render(<DiffViewer changes={[]} />)
    expect(screen.getByText(/No differences/i)).toBeInTheDocument()
  })
})

describe("LockIndicator", () => {
  const lock = {
    id: 1,
    content_label: "Article",
    locked_by: { id: 1, username: "alice" },
    expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
    note: "",
    created_at: new Date().toISOString(),
  }

  it("shows the lock owner", () => {
    render(<LockIndicator lock={lock} />)
    expect(screen.getByText(/alice/)).toBeInTheDocument()
    expect(screen.getByText(/auto-unlocks/)).toBeInTheDocument()
  })

  it("renders nothing when there is no lock", () => {
    const { container } = render(<LockIndicator lock={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
