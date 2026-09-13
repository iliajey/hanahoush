/** Confirmation dialog for destructive/sensitive user actions (Phase 12).
 *
 * Used before activate/deactivate and password changes: the dialog names the
 * affected account, explains the consequence, and requires an explicit
 * confirm click. Never displays password material.
 */
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

export type ConfirmActionKind = "activate" | "deactivate" | "setPassword"

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: ConfirmActionKind
  username: string
  pending?: boolean
  error?: string | null
  onConfirm: () => void
}

const TITLE_KEYS: Record<ConfirmActionKind, string> = {
  activate: "users.confirm.activateTitle",
  deactivate: "users.confirm.deactivateTitle",
  setPassword: "users.confirm.setPasswordTitle",
}

const BODY_KEYS: Record<ConfirmActionKind, string> = {
  activate: "users.confirm.activateBody",
  deactivate: "users.confirm.deactivateBody",
  setPassword: "users.confirm.setPasswordBody",
}

const CONFIRM_KEYS: Record<ConfirmActionKind, string> = {
  activate: "users.actions.activate",
  deactivate: "users.actions.deactivate",
  setPassword: "users.actions.savePassword",
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  kind,
  username,
  pending,
  error,
  onConfirm,
}: ConfirmActionDialogProps) {
  const { t } = useTranslation()
  const destructive = kind === "deactivate"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t(TITLE_KEYS[kind])}</DialogTitle>
          <DialogDescription>
            {t(BODY_KEYS[kind], { username })}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? <Spinner size="sm" aria-hidden="true" /> : null}
            {t(CONFIRM_KEYS[kind])}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
