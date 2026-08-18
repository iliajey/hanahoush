import DOMPurify from "dompurify"

import { headingId } from "../utils"
import type { TocEntry } from "../types"

/** Language detection from a code class (e.g. "language-python"). */
export function codeLanguage(codeElement: HTMLElement): string {
  const className = codeElement.className || ""
  const match = className.match(/(?:language|lang)-([a-z0-9+#]+)/i)
  return match ? match[1].toLowerCase() : "text"
}

export interface TransformedArticle {
  html: string
  toc: TocEntry[]
}

/**
 * Safely render article HTML.
 *
 * 1. Sanitize with DOMPurify (removes <script>, event handlers and unsafe
 *    URL schemes such as `javascript:`).
 * 2. Post-process: give headings stable ids (for the table of contents) and
 *    mark code blocks with their language.
 *
 * Returns the safe HTML string + the extracted table of contents.
 */
export function transformArticleContent(rawHtml: string, startIndex = 0): TransformedArticle {
  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  })
  const doc = new DOMParser().parseFromString(clean, "text/html")
  const toc: TocEntry[] = []

  doc.querySelectorAll("h2, h3").forEach((node, i) => {
    const level = node.tagName.toLowerCase() === "h2" ? 2 : 3
    const text = (node.textContent || "").trim()
    if (!text) return
    const id = headingId(text, startIndex + i)
    node.setAttribute("id", id)
    toc.push({ id, text, level })
  })

  doc.querySelectorAll("pre > code").forEach((code) => {
    code.setAttribute("data-language", codeLanguage(code as HTMLElement))
  })

  return { html: doc.body.innerHTML, toc }
}

/** Validate the serialized JSON-LD object is well-formed (best-effort). */
export function isValidJsonLd(data: unknown): boolean {
  try {
    JSON.stringify(data)
    return true
  } catch {
    return false
  }
}