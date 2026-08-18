import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BrandLogo } from "@/components/brand/BrandLogo"
import { brandAsset } from "@/config/brand"

describe("BrandLogo", () => {
  it("renders the icon-only mark with an accessible name", () => {
    render(<BrandLogo alt="Hanahoush" />)
    const img = screen.getByAltText("Hanahoush")
    expect(img).toHaveAttribute("src", brandAsset.mark)
  })

  it("renders the full-lockup variant", () => {
    render(<BrandLogo variant="full" alt="Hanahoush" />)
    const img = screen.getByAltText("Hanahoush")
    expect(img).toHaveAttribute("src", brandAsset.full)
  })

  it("passes sizing classes through", () => {
    render(<BrandLogo alt="Hanahoush" className="h-8 w-auto" eager />)
    const img = screen.getByAltText("Hanahoush")
    expect(img).toHaveClass("h-8", "w-auto")
    expect(img).toHaveAttribute("loading", "eager")
  })
})