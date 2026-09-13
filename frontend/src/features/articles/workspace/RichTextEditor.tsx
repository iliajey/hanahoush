import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import DOMPurify from "dompurify"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo,
} from "lucide-react"

import { cn } from "@/shared/lib/cn"

const SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "strong", "em", "u", "s", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "a", "img",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
    "div", "span", "figure", "figcaption", "sup", "sub",
  ],
  ALLOWED_ATTR: [
    "href", "title", "target", "rel",
    "src", "alt",
    "colspan", "rowspan",
    "dir", "lang", "id", "class",
    "data-language",
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
}

export function sanitizeEditorHtml(raw: string): string {
  return DOMPurify.sanitize(raw, SANITIZE_CONFIG)
}

export interface EditorStats {
  words: number
  characters: number
  readingMinutes: number
}

export function editorStatsFor(html: string, wordsPerMinute = 200): EditorStats {
  const text = sanitizeEditorHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const words = text ? text.split(" ").filter(Boolean).length : 0
  return {
    words,
    characters: text.length,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / wordsPerMinute)),
  }
}

interface RichTextEditorProps {
  id?: string
  label: string
  value: string
  onChange: (html: string) => void
  dir?: "auto" | "ltr" | "rtl"
  minHeight?: number
  placeholder?: string
  disabled?: boolean
  onInsertImage?: () => void
  externalImageSignal?: { url: string; alt: string; nonce: number } | null
}

function ToolbarButton({
  title,
  onAction,
  active,
  children,
  disabled,
}: {
  title: string
  onAction: () => void
  active?: boolean
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault()
        onAction()
      }}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  id,
  label,
  value,
  onChange,
  dir = "auto",
  minHeight = 240,
  placeholder,
  disabled,
  onInsertImage,
  externalImageSignal,
}: RichTextEditorProps) {
  const { t } = useTranslation()
  const generatedId = useId()
  const editorId = id ?? `rte-${generatedId}`
  const toolbarId = `${editorId}-toolbar`
  const ref = useRef<HTMLDivElement>(null)
  const [activeTag, setActiveTag] = useState("")
  const appliedImageNonce = useRef(0)

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus()
      document.execCommand(command, false, arg)
      if (ref.current) onChange(ref.current.innerHTML)
    },
    [onChange],
  )

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (document.activeElement === node) return
    const next = value || ""
    if (node.innerHTML !== next) node.innerHTML = next
  }, [value])

  useEffect(() => {
    if (!externalImageSignal) return
    if (appliedImageNonce.current === externalImageSignal.nonce) return
    appliedImageNonce.current = externalImageSignal.nonce
    const node = ref.current
    if (!node) return
    node.focus()
    const safeAlt = externalImageSignal.alt.replace(/"/g, "&quot;")
    document.execCommand(
      "insertHTML",
      false,
      `<figure><img src="${externalImageSignal.url}" alt="${safeAlt}" loading="lazy" /><figcaption>${safeAlt}</figcaption></figure><p><br /></p>`,
    )
    onChange(node.innerHTML)
  }, [externalImageSignal, onChange])

  const refreshActive = useCallback(() => {
    try {
      const tag = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>"']/g, "")
      setActiveTag(tag)
    } catch {
      setActiveTag("")
    }
  }, [])

  const stats = useMemo(() => editorStatsFor(value), [value])

  const insertLink = useCallback(() => {
    const url = window.prompt(t("articleEditor.linkPrompt"))
    if (!url) return
    exec("createLink", url)
  }, [exec, t])

  const insertTable = useCallback(() => {
    exec(
      "insertHTML",
      "<table><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr><tbody></tbody></tbody></table><p><br /></p>",
    )
  }, [exec])

  const insertCodeBlock = useCallback(() => {
    exec("insertHTML", "<pre><code class=\"language-text\">// code</code></pre><p><br /></p>")
  }, [exec])

  const iconCls = "h-4 w-4"

  return (
    <div className="overflow-hidden rounded-md border">
      <div
        id={toolbarId}
        role="toolbar"
        aria-label={label}
        className="sticky top-0 z-10 flex max-h-32 flex-wrap items-center gap-0.5 overflow-y-auto border-b bg-muted/40 p-1.5"
      >
        <ToolbarButton title={t("articleEditor.undo")} onAction={() => exec("undo")} disabled={disabled}>
          <Undo className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.redo")} onAction={() => exec("redo")} disabled={disabled}>
          <Redo className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton title={t("articleEditor.h1")} onAction={() => exec("formatBlock", "h1")} active={activeTag === "h1"} disabled={disabled}>
          <Heading1 className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.h2")} onAction={() => exec("formatBlock", "h2")} active={activeTag === "h2"} disabled={disabled}>
          <Heading2 className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.h3")} onAction={() => exec("formatBlock", "h3")} active={activeTag === "h3"} disabled={disabled}>
          <Heading3 className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.paragraph")} onAction={() => exec("formatBlock", "p")} active={activeTag === "p"} disabled={disabled}>
          <span className="px-1 text-xs font-bold">P</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton title={t("articleEditor.bold")} onAction={() => exec("bold")} disabled={disabled}>
          <Bold className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.italic")} onAction={() => exec("italic")} disabled={disabled}>
          <Italic className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.underline")} onAction={() => exec("underline")} disabled={disabled}>
          <Underline className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.strikethrough")} onAction={() => exec("strikeThrough")} disabled={disabled}>
          <Strikethrough className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.inlineCode")} onAction={() => exec("insertHTML", "<code>code</code>")} disabled={disabled}>
          <Code className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton title={t("articleEditor.bulletList")} onAction={() => exec("insertUnorderedList")} disabled={disabled}>
          <List className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.orderedList")} onAction={() => exec("insertOrderedList")} disabled={disabled}>
          <ListOrdered className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.indent")} onAction={() => exec("indent")} disabled={disabled}>
          <span className="px-1 text-xs font-bold">→</span>
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.outdent")} onAction={() => exec("outdent")} disabled={disabled}>
          <span className="px-1 text-xs font-bold">←</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton title={t("articleEditor.quote")} onAction={() => exec("formatBlock", "blockquote")} active={activeTag === "blockquote"} disabled={disabled}>
          <Quote className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.link")} onAction={insertLink} disabled={disabled}>
          <LinkIcon className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.removeLink")} onAction={() => exec("unlink")} disabled={disabled}>
          <span className="px-1 text-xs font-bold line-through">A</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton title={t("articleEditor.alignLeft")} onAction={() => exec("justifyLeft")} disabled={disabled}>
          <AlignLeft className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.alignCenter")} onAction={() => exec("justifyCenter")} disabled={disabled}>
          <AlignCenter className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.alignRight")} onAction={() => exec("justifyRight")} disabled={disabled}>
          <AlignRight className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton title={t("articleEditor.image")} onAction={() => onInsertImage?.()} disabled={disabled || !onInsertImage}>
          <ImageIcon className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.table")} onAction={insertTable} disabled={disabled}>
          <TableIcon className={iconCls} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.codeBlock")} onAction={insertCodeBlock} disabled={disabled}>
          <span className="px-1 font-mono text-xs font-bold">{"</>"}</span>
        </ToolbarButton>
        <ToolbarButton title={t("articleEditor.horizontalRule")} onAction={() => exec("insertHorizontalRule")} disabled={disabled}>
          <span className="px-1 text-xs font-bold">—</span>
        </ToolbarButton>
      </div>

      <div
        id={editorId}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-describedby={`${editorId}-stats`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        dir={dir}
        data-placeholder={placeholder ?? ""}
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        onFocus={refreshActive}
        onPaste={(event) => {
          event.preventDefault()
          const html = event.clipboardData?.getData("text/html")
          const text = event.clipboardData?.getData("text/plain") ?? ""
          const clean = sanitizeEditorHtml(html || `<p>${text.replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br />")}</p>`)
          document.execCommand("insertHTML", false, clean)
          if (ref.current) onChange(ref.current.innerHTML)
        }}
        className="article-body prose prose-slate max-w-none overflow-y-auto bg-background px-4 py-3 text-sm leading-7 focus:outline-none dark:prose-invert [&:empty:before]:text-muted-foreground [&:empty:before]:content-[attr(data-placeholder)]"
        style={{ minHeight, maxHeight: 640 }}
      />

      <div
        id={`${editorId}-stats`}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
        aria-live="off"
      >
        <span>{t("articleEditor.wordCount", { count: stats.words })}</span>
        <span>{t("articleEditor.charCount", { count: stats.characters })}</span>
        <span>{t("articleEditor.readingTime", { count: stats.readingMinutes })}</span>
        <span className="ms-auto hidden sm:inline">{t("articleEditor.autosafeHint")}</span>
      </div>
    </div>
  )
}

