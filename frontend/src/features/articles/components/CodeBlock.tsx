import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/shared/lib/cn"
import { articleAnalytics } from "../services/analytics"
import { highlight } from "../utils/highlight"

/** Accessible, horizontally-scrollable code block with language label + copy. */
export function CodeBlock({ code, language, className }: { code: string; language?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const lang = (language || "text").toLowerCase()
  const html = highlight(code, lang)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      articleAnalytics.copyLink()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn("group/code my-6 overflow-hidden rounded-xl border bg-slate-950 text-slate-100", className)}>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-400">{lang}</span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copy code"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed" tabIndex={0}>
        <code className="font-mono" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}