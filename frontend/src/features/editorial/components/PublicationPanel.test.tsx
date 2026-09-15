import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"

import { ToastProvider } from "@/components/ui/toast"
import LanguageProvider from "@/app/language/LanguageProvider"

import { PublicationPanel } from "./PublicationPanel"

function harness(ui: ReactNode) {
  return render(
    <LanguageProvider>
      <ToastProvider>{ui}</ToastProvider>
    </LanguageProvider>,
  )
}

describe("PublicationPanel 2.0 (Phase 17)", () => {
  it("explains blocking issues with locale + message", () => {
    harness(
      <PublicationPanel
        status="draft"
        workflowStage="approved"
        canSubmit={false}
        canSchedule
        canPublish
        blocking={[{ field: "title_en", locale: "en", message: "English title is required." }]}
      />,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("EN")
    expect(screen.getByRole("alert")).toHaveTextContent("English title is required.")
  })

  it("explains missing publish permission instead of silent disable", () => {
    harness(
      <PublicationPanel
        status="draft"
        workflowStage="approved"
        canSubmit={false}
        canSchedule={false}
        canPublish={false}
      />,
    )
    expect(screen.getByText(/do not have permission to publish/i)).toBeVisible()
  })

  it("shows per-locale completeness dots with accessible labels", () => {
    harness(
      <PublicationPanel
        status="draft"
        workflowStage="draft"
        canSubmit={false}
        canSchedule={false}
        canPublish={false}
        localeCompleteness={{ en: true, fa: true, ar: false }}
      />,
    )
    expect(screen.getByLabelText("EN — complete")).toBeVisible()
    expect(screen.getByLabelText("AR — incomplete")).toBeVisible()
  })

  it("links successful actions to the timeline (phase 20)", () => {
    harness(
      <PublicationPanel
        status="published"
        workflowStage="approved"
        canSubmit={false}
        canSchedule
        canPublish
        onSchedule={() => undefined}
        onPublish={() => undefined}
      />,
    )
    expect(screen.queryByText(/open timeline/i)).not.toBeInTheDocument()
  })
})
