import { describe, expect, it } from "vitest"
import { fireEvent, screen } from "@testing-library/react"

import { renderWithProviders } from "../../../tests/setup/test-utils"
import i18n from "@/i18n"
import { LanguageDropdown } from "@/components/ui/language-dropdown"

describe("LanguageDropdown", () => {
  it("shows the active language and opens the FA/EN/AR menu", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<LanguageDropdown />)
    expect(screen.getByRole("button", { name: "Language" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Language" }))
    expect(screen.getByRole("listbox", { name: "Language" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /فارسی/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /English/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /العربية/ })).toBeInTheDocument()
  })

  it("marks the active language and closes after selection", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(<LanguageDropdown />)
    fireEvent.click(screen.getByRole("button", { name: "Language" }))
    const english = screen.getByRole("option", { name: /English/ })
    expect(english).toHaveAttribute("aria-selected", "true")
    fireEvent.click(screen.getByRole("option", { name: /فارسی/ }))
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
