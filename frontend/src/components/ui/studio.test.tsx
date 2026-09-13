import { describe, expect, it, vi } from "vitest"
import { fireEvent, screen } from "@testing-library/react"

import { renderWithProviders } from "../../../tests/setup/test-utils"
import i18n from "@/i18n"

import { ContentHealthPanel } from "./content-health"
import { StudioLocaleSelect } from "./studio-locale-select"

describe("StudioLocaleSelect (Phase 15)", () => {
  it("shows the active language and switches on select", async () => {
    await i18n.changeLanguage("en")
    const onChange = vi.fn()
    renderWithProviders(
      <StudioLocaleSelect
        value="en"
        onChange={onChange}
        completeness={{ fa: true, en: true, ar: false }}
      />,
    )
    const trigger = screen.getByRole("combobox", { name: "Editing language" })
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole("option", { name: /العربية/ }))
    expect(onChange).toHaveBeenCalledWith("ar")
  })
})

describe("ContentHealthPanel (Phase 15)", () => {
  it("renders actionable items and navigates on click", async () => {
    await i18n.changeLanguage("en")
    const onNavigate = vi.fn()
    renderWithProviders(
      <ContentHealthPanel
        items={[
          { key: "slug", severity: "critical", message: "Slug is missing", target: "slug" },
          { key: "cover", severity: "warning", message: "No cover image" },
        ]}
        stats={[{ label: "Words", value: 10 }]}
        onNavigate={onNavigate}
      />,
    )
    expect(screen.getByText("Slug is missing")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Slug is missing"))
    expect(onNavigate).toHaveBeenCalled()
  })

  it("shows the healthy confirmation when empty", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<ContentHealthPanel items={[]} />)
    expect(screen.getByText("Healthy")).toBeInTheDocument()
  })
})
