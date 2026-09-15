import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { OgImageField } from "./OgImageField"

describe("OgImageField", () => {
  it("shows empty state when no preview", () => {
    render(<OgImageField id="og" preview={null} onChoose={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText("seo.noOgImage")).toBeInTheDocument()
  })

  it("shows preview image and remove action when set", () => {
    const { container } = render(<OgImageField id="og" preview="https://cdn/x.png" onChoose={vi.fn()} onRemove={vi.fn()} />)
    expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn/x.png")
    expect(screen.getByRole("button", { name: "seo.removeOgImage" })).toBeInTheDocument()
  })
})
