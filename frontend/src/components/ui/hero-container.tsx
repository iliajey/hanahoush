import type { ReactNode } from "react"
import { motion } from "framer-motion"

import { cn } from "@/shared/lib/cn"

import { SectionTitle } from "./section-title"

export interface HeroContainerProps {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  align?: "start" | "center"
  className?: string
  children?: ReactNode
}

/** Hero band used at the top of pages (not a landing page — a layout piece). */
export function HeroContainer({
  title,
  description,
  eyebrow,
  actions,
  align = "center",
  className,
  children,
}: HeroContainerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b bg-gradient-to-b from-brand-50/60 to-background py-16 dark:from-brand-950/40 sm:py-24",
        className,
      )}
    >
      <div className="container-hanahoush">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("flex flex-col gap-6", align === "center" && "items-center text-center")}
        >
          <SectionTitle eyebrow={eyebrow} title={title} description={description} align={align} />
          {actions ? <div className={cn("flex flex-wrap gap-3", align === "center" && "justify-center")}>{actions}</div> : null}
          {children}
        </motion.div>
      </div>
    </section>
  )
}
