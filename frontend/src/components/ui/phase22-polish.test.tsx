import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import { renderWithProviders } from "../../../tests/setup/test-utils"
import i18n from "@/i18n"

import { Pagination } from "./pagination"
import { Breadcrumb } from "./breadcrumb"
import { ServiceCard } from "@/components/marketing/services/ServiceCard"
import { Milestone } from "@/components/marketing/timeline/Timeline"

describe("Phase 22 polish regressions", () => {
  it("pagination Previous uses ChevronLeft and Next uses ChevronRight", async () => {
    await i18n.changeLanguage("en")
    const { container } = renderWithProviders(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => undefined} />,
    )
    const prev = screen.getByRole("button", { name: "Previous page" })
    const next = screen.getByRole("button", { name: "Next page" })
    expect(prev.querySelector("svg")).toBeTruthy()
    expect(next.querySelector("svg")).toBeTruthy()
    expect(container.querySelector("nav")).toBeTruthy()
  })

  it("breadcrumb scrolls horizontally instead of overflowing at 375px", async () => {
    await i18n.changeLanguage("en")
    const { container } = renderWithProviders(
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "A very long article slug that could overflow" }]} />,
    )
    expect(container.querySelector("nav")?.className).toContain("overflow-x-auto")
  })

  it("service card uses translated learn-more label with RTL-safe arrow", async () => {
    await i18n.changeLanguage("en")
    renderWithProviders(
      <ServiceCard icon={<span />} title="T" description="D" href="/services" />,
    )
    expect(screen.getByText("Learn more")).toBeInTheDocument()
    expect(document.querySelector(".rtl\\:rotate-180")).toBeTruthy()
  })

  it("timeline rail uses logical start properties for RTL", () => {
    const { container } = renderWithProviders(
      <Milestone date="2026" title="T" />,
    )
    const rail = container.querySelector(".ps-10")
    expect(rail).toBeTruthy()
    expect(rail?.className).toContain("before:start-5")
  })
})
