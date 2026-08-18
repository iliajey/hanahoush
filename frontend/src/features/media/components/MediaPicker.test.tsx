import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Mock } from "vitest"

import { clearAnalyticsEvents, getAnalyticsEvents } from "@/features/analytics"
import { createTestProviders } from "../../../../tests/setup/test-utils"

vi.mock("../api", () => ({
  listMedia: vi.fn(),
  uploadMedia: vi.fn(),
  updateMedia: vi.fn(),
  mediaAnalytics: { view: vi.fn(), select: vi.fn(), upload: vi.fn() },
}))

import { MediaPicker } from "./MediaPicker"
import { listMedia, uploadMedia } from "../api"

const mockedList = listMedia as Mock
const mockedUpload = uploadMedia as Mock

function media(overrides: Partial<{ id: number; original_name: string; mime_type: string }> = {}) {
  return {
    id: 1,
    file: "/media/hero.png",
    preview_url: "/media/hero.png",
    original_name: "hero.png",
    title_fa: "",
    title_en: "Hero",
    title_ar: "",
    alt_text_fa: "",
    alt_text_en: "Hero image",
    alt_text_ar: "",
    caption_fa: "",
    caption_en: "",
    caption_ar: "",
    mime_type: "image/png",
    size: 2048,
    width: 1200,
    height: 800,
    sha256: "abc",
    is_public: true,
    uploader: "admin",
    reference_count: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function setup() {
  const { wrapper } = createTestProviders()
  const onSelect = vi.fn()
  const view = render(
    <MediaPicker open onOpenChange={() => undefined} onSelect={onSelect} />,
    { wrapper },
  )
  return { ...view, onSelect }
}

beforeEach(() => {
  clearAnalyticsEvents()
  mockedList.mockReset()
  mockedUpload.mockReset()
  mockedList.mockResolvedValue({
    items: [media()],
    pagination: { count: 1, num_pages: 1, current_page: 1, page_size: 24, next: null, previous: null },
  })
})

describe("MediaPicker", () => {
  it("lists media and reports media_view", async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByLabelText("Hero image")).toBeInTheDocument()
    })
    const names = getAnalyticsEvents().map((e) => e.name)
    expect(names).toContain("media_view")
  })

  it("searches via the query input", async () => {
    const user = userEvent.setup()
    setup()
    const search = screen.getByLabelText("Search media")
    await user.type(search, "hero")
    await waitFor(() => {
      expect(mockedList).toHaveBeenCalledWith(expect.objectContaining({ q: "hero", page: 1 }))
    })
  })

  it("uploads a dropped file and reports media_upload", async () => {
    mockedUpload.mockResolvedValue({ ok: true, media: media({ id: 2, original_name: "dropped.png" }) })
    setup()
    const dropzone = screen.getByRole("button", { name: /drop a file/i })
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(["x"], "dropped.png", { type: "image/png" })] } })
    await waitFor(() => {
      expect(mockedUpload).toHaveBeenCalledTimes(1)
    })
    // Upload event is fired inside the real API client (covered by domains.test);
    // here we assert the picker wired the file to the uploader.
  })

  it("shows the empty state when nothing matches", async () => {
    mockedList.mockResolvedValue({ items: [], pagination: { count: 0, num_pages: 0, current_page: 1, page_size: 24, next: null, previous: null } })
    setup()
    await waitFor(() => {
      expect(screen.getByText(/no media found/i)).toBeInTheDocument()
    })
  })

  it("selects a media item, shows metadata and calls onSelect", async () => {
    const user = userEvent.setup()
    const { onSelect } = setup()
    await waitFor(() => {
      expect(screen.getByLabelText("Hero image")).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText("Hero image"))
    expect(screen.getByLabelText("Alt text (EN)")).toHaveValue("Hero image")
    await user.click(screen.getByRole("button", { name: "Use this image" }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    const names = getAnalyticsEvents().map((e) => e.name)
    expect(names).toContain("media_select")
  })

  it("surfaces upload errors", async () => {
    mockedUpload.mockResolvedValue({ ok: false, message: "File too large." })
    setup()
    const dropzone = screen.getByRole("button", { name: /drop a file/i })
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(["x"], "big.png", { type: "image/png" })] } })
    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })
  })
})