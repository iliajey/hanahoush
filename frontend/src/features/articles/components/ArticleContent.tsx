import { useMemo } from "react"

import { CodeBlock } from "./CodeBlock"
import { transformArticleContent } from "../services/content"
import type { TocEntry } from "../types"

type Segment =
  | { kind: "html"; html: string }
  | { kind: "code"; code: string; language: string }

function splitCodeBlocks(html: string): Segment[] {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html")
  const container = doc.body.firstElementChild as HTMLElement
  const segments: Segment[] = []
  let buffer = ""

  const flush = () => {
    if (buffer) {
      segments.push({ kind: "html", html: buffer })
      buffer = ""
    }
  }

  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === "pre") {
      const pre = node as HTMLPreElement
      const codeEl = pre.querySelector("code")
      if (codeEl) {
        flush()
        segments.push({
          kind: "code",
          code: codeEl.textContent || "",
          language: codeEl.getAttribute("data-language") || "text",
        })
        return
      }
    }
    buffer += (node as HTMLElement).outerHTML ?? node.textContent ?? ""
  })
  flush()
  return segments
}

/**
 * Safe article body renderer.
 *
 * - Sanitizes the CKEditor HTML with DOMPurify (blocks scripts + unsafe URLs).
 * - Assigns heading ids (for the TOC) and code-block languages.
 * - Renders code blocks through the accessible <CodeBlock /> component.
 */
export function ArticleContent({
  html,
  className,
  onToc,
}: {
  html: string
  className?: string
  onToc?: (toc: TocEntry[]) => void
}) {
  const transformed = useMemo(() => transformArticleContent(html), [html])
  const segments = useMemo(() => splitCodeBlocks(transformed.html), [transformed.html])

  if (transformed.toc.length > 0 && onToc) onToc(transformed.toc)

  return (
    <article className={className}>
      {segments.map((segment, i) =>
        segment.kind === "code" ? (
          <CodeBlock key={i} code={segment.code} language={segment.language} />
        ) : (
          <div key={i} className="article-body" dangerouslySetInnerHTML={{ __html: segment.html }} />
        ),
      )}
    </article>
  )
}