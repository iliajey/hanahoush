import type { ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

/**
 * Modal — a convenience wrapper over <Dialog /> with a default footer.
 */
export interface ModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
  closeButton?: boolean
}

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
  closeButton = true,
}: ModalProps) {
  const content = (
    <DialogContent className={cn("max-h-[90vh] overflow-y-auto", className)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children}
      {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      {closeButton ? (
        <DialogClose className="sr-only" aria-label="Close" />
      ) : null}
    </DialogContent>
  )

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  )
}
