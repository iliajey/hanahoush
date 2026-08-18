import { cn } from "@/shared/lib/cn"
import { Badge } from "@/components/ui/badge"

const STAGE_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  seo_review: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  scheduled: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  published: "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  archived: "bg-slate-500/15 text-slate-500",
}

/** Colored workflow-stage badge. */
export function WorkflowBadge({ stageCode, stageName, className }: { stageCode: string; stageName?: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", STAGE_STYLES[stageCode], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {stageName ?? stageCode.replace("_", " ")}
    </Badge>
  )
}