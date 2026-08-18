import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react"

import { cn } from "@/shared/lib/cn"

export type ToastVariant = "default" | "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (options: Omit<Toast, "id">) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within a ToastProvider")
  return context
}

const iconMap: Record<ToastVariant, ReactNode> = {
  default: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
}

const accentMap: Record<ToastVariant, string> = {
  default: "text-foreground",
  success: "text-emerald-500",
  error: "text-destructive",
  warning: "text-amber-500",
  info: "text-brand-500",
}

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => setToasts([]), [])

  const toast = useCallback(
    (options: Omit<Toast, "id">) => {
      const id = `toast-${++counter.current}`
      setToasts((prev) => [...prev.slice(-4), { ...options, id }])
      return id
    },
    [],
  )

  const value = useMemo(
    () => ({ toasts, toast, dismiss, dismissAll }),
    [toasts, toast, dismiss, dismissAll],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="pointer-events-none fixed bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg",
              t.variant === "default" && "border-border",
              t.variant === "success" && "border-emerald-500/30",
              t.variant === "error" && "border-destructive/30",
              t.variant === "warning" && "border-amber-500/30",
              t.variant === "info" && "border-brand-500/30",
            )}
          >
            <span className={cn("mt-0.5 shrink-0", accentMap[t.variant])}>{iconMap[t.variant]}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
