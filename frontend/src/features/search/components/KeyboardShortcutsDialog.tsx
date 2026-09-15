import { useTranslation } from "react-i18next"
import { Keyboard } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export function KeyboardShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const rows: Array<[string, string]> = [
    [t("shortcuts.keys.command"), t("shortcuts.desc.command")],
    [t("shortcuts.keys.close"), t("shortcuts.desc.close")],
    [t("shortcuts.keys.navigate"), t("shortcuts.desc.navigate")],
    [t("shortcuts.keys.open"), t("shortcuts.desc.open")],
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            {t("shortcuts.title")}
          </DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {rows.map(([key, desc]) => (
            <li key={key} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[11px] font-semibold">{key}</kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
