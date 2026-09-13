import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { editorStatsFor, sanitizeEditorHtml, RichTextEditor } from "./RichTextEditor"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => `${key}${opts?.count != null ? `:${opts.count}` : ""}` }),
}))

describe("sanitizeEditorHtml", () => {
  it("strips scripts, event handlers and javascript: URLs but keeps structure", () => {
    const clean = sanitizeEditorHtml(
      '<h2>Title</h2><p onclick="evil()">Hi <a href="javascript:alert(1)">x</a></p><script>alert(1)</script><table><tr><td>c</td></tr></table>',
    )
    expect(clean).toContain("<h2>Title</h2>")
    expect(clean).toContain("<table>")
    expect(clean).not.toContain("<script")
    expect(clean).not.toContain("onclick")
    expect(clean).not.toContain("javascript:")
  })

  it("keeps RTL/LTR markers, images, code blocks and captions", () => {
    const clean = sanitizeEditorHtml(
      '<p dir="rtl">متن</p><pre><code class="language-python">print(1)</code></pre><figure><img src="https://example.com/a.png" alt="a" /><figcaption>c</figcaption></figure>',
    )
    expect(clean).toContain('dir="rtl"')
    expect(clean).toContain("<pre>")
    expect(clean).toContain("<figure>")
    expect(clean).toContain('src="https://example.com/a.png"')
  })
})

describe("editorStatsFor", () => {
  it("counts words/characters and estimates reading time", () => {
    expect(editorStatsFor("")).toEqual({ words: 0, characters: 0, readingMinutes: 0 })
    const stats = editorStatsFor("<h2>Hi</h2><p>" + "word ".repeat(400) + "</p>")
    expect(stats.words).toBeGreaterThanOrEqual(400)
    expect(stats.readingMinutes).toBeGreaterThanOrEqual(2)
  })
})

describe("RichTextEditor", () => {
  it("renders a labelled toolbar, an editable canvas and live stats", () => {
    const onChange = vi.fn()
    render(<RichTextEditor label="Body (English)" value="<p>Hello world</p>" onChange={onChange} />)
    expect(screen.getByRole("toolbar", { name: "Body (English)" })).toBeInTheDocument()
    const canvas = screen.getByRole("textbox", { name: "Body (English)" })
    expect(canvas).toHaveAttribute("contenteditable", "true")
    expect(screen.getByText("articleEditor.wordCount:2")).toBeInTheDocument()
  })

  it("emits content on input without truncating long bodies", () => {
    const onChange = vi.fn()
    const longHtml = `<p>${"word ".repeat(5000)}</p>`
    render(<RichTextEditor label="Body" value="" onChange={onChange} />)
    const canvas = screen.getByRole("textbox", { name: "Body" })
    fireEvent.input(canvas, { target: { innerHTML: longHtml } })
    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.map((call) => String(call[0]).length)
    expect(Math.max(...emitted)).toBeGreaterThan(20000)
  })

  it("sanitizes pasted HTML before inserting", () => {
    const onChange = vi.fn()
    if (typeof document.execCommand !== "function") {
      Object.defineProperty(document, "execCommand", { value: () => true, configurable: true })
    }
    const execSpy = vi.spyOn(document, "execCommand").mockImplementation(() => true)
    render(<RichTextEditor label="Body" value="" onChange={onChange} />)
    const canvas = screen.getByRole("textbox", { name: "Body" })
    const clipboardData = {
      getData: (type: string) => (type === "text/html" ? '<p onclick="x()">Hi</p><script>evil()</script>' : "Hi"),
    }
    fireEvent.paste(canvas, { clipboardData } as unknown as ClipboardEventInit)
    expect(execSpy).toHaveBeenCalled()
    const inserted = String(execSpy.mock.calls[0][2])
    expect(inserted).not.toContain("onclick")
    expect(inserted).not.toContain("<script")
    execSpy.mockRestore()
  })

  it("respects the requested text direction for RTL locales", () => {
    render(<RichTextEditor label="متن" value="" onChange={vi.fn()} dir="rtl" />)
    expect(screen.getByRole("textbox", { name: "متن" })).toHaveAttribute("dir", "rtl")
  })
})
