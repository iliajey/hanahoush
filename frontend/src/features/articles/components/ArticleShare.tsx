import { useState } from "react"
import { Check, Link2, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { articleAnalytics } from "../services/analytics"

/** Copy-link + Web Share API actions (no third-party tracking). */
export function ArticleShare({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      articleAnalytics.copyLink()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url })
        articleAnalytics.share("web-share")
      } catch {
        /* cancelled */
      }
      return
    }
    await copy()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Share</span>
      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => void copy()} aria-label="Copy link">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />} Copy link
      </Button>
      {typeof navigator.share === "function" ? (
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => void share()} aria-label="Share article">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      ) : null}
    </div>
  )
}