import { CheckCircle2, Clock, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type ApprovalStatusType = "pending" | "approved" | "rejected"

const CONFIG: Record<ApprovalStatusType, { label: string; Icon: typeof Clock; variant: "secondary" | "default" | "destructive" }> = {
  pending: { label: "Pending", Icon: Clock, variant: "secondary" },
  approved: { label: "Approved", Icon: CheckCircle2, variant: "default" },
  rejected: { label: "Rejected", Icon: XCircle, variant: "destructive" },
}

/** Renders an approval decision status with icon. */
export function ApprovalStatus({ status }: { status: ApprovalStatusType | string }) {
  const config = CONFIG[status as ApprovalStatusType] ?? CONFIG.pending
  const Icon = config.Icon
  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}