import { CheckCircle2, MessageSquare, Send } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/shared/lib/cn"
import type { ReviewComment } from "../types"

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
  } catch {
    return value
  }
}

function CommentItem({
  comment,
  onResolve,
  onReply,
  depth = 0,
}: {
  comment: ReviewComment
  onResolve?: (comment: ReviewComment) => void
  onReply?: (body: string, parent: ReviewComment) => void
  depth?: number
}) {
  const [replyText, setReplyText] = useState("")
  return (
    <div className={cn("space-y-2", depth > 0 && "ml-6 border-l pl-3")}>
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{comment.created_by?.username ?? "user"}</span>
            <span>{formatDate(comment.created_at)}</span>
            {comment.mentions.length > 0 ? (
              <span className="text-brand-600 dark:text-brand-400">mentions {comment.mentions.length}</span>
            ) : null}
          </div>
          {comment.resolved ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 /> resolved
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm">{comment.body}</p>
        <div className="mt-2 flex gap-2">
          {!comment.resolved && onResolve ? (
            <Button size="sm" variant="ghost" onClick={() => onResolve(comment)}>
              Resolve
            </Button>
          ) : null}
          {onReply ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (replyText.trim()) {
                  onReply(replyText.trim(), comment)
                  setReplyText("")
                }
              }}
            >
              Reply
            </Button>
          ) : null}
        </div>
        {onReply ? (
          <div className="mt-2 flex gap-2">
            <Input placeholder="Reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} className="h-8 text-sm" />
            <Button size="sm" variant="outline" className="h-8 px-2">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
      {(comment.replies ?? []).map((reply) => (
        <div key={reply.id}>
          <CommentItem comment={reply} onResolve={onResolve} onReply={onReply} depth={depth + 1} />
        </div>
      ))}
    </div>
  )
}

/** A threaded review comment list with resolve + reply support. */
export function CommentThread({
  comments,
  onResolve,
  onReply,
  onCompose,
}: {
  comments: ReviewComment[]
  onResolve?: (comment: ReviewComment) => void
  onReply?: (body: string, parent: ReviewComment) => void
  onCompose?: (body: string) => void
}) {
  const [draft, setDraft] = useState("")
  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onResolve={onResolve} onReply={onReply} />
        ))
      )}
      {onCompose ? (
        <div className="flex gap-2">
          <Input
            placeholder="Add a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onCompose(draft.trim())
                setDraft("")
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              if (draft.trim()) {
                onCompose(draft.trim())
                setDraft("")
              }
            }}
          >
            Comment
          </Button>
        </div>
      ) : null}
    </div>
  )
}