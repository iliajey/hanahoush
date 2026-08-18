import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { Button } from "@/components/ui/button"
import { RevealContainer } from "../common/RevealContainer"

interface CTAProps { title: string; description?: string; primary?: { label: string; href: string }; secondary?: { label: string; href: string }; variant?: "default" | "split" | "gradient"; onPrimaryClick?: () => void; onSecondaryClick?: () => void; children?: ReactNode; className?: string }

export function CTA({ title, description, primary, secondary, variant = "default", onPrimaryClick, onSecondaryClick, children, className }: CTAProps) {
  const isGradient = variant === "gradient"
  return (
    <RevealContainer className={cn(
      "flex flex-col items-center gap-6 rounded-3xl p-10 text-center sm:p-16", isGradient && "bg-gradient-to-br from-brand-600 to-brand-900 text-white dark:from-brand-600 dark:to-brand-950",
      !isGradient && "border bg-card", className)}>
      <h2 className={cn("text-3xl font-bold tracking-tight sm:text-4xl", isGradient && "text-white")}>{title}</h2>
      {description && <p className={cn("max-w-2xl text-lg", isGradient ? "text-white/80" : "text-muted-foreground")}>{description}</p>}
      <div className="flex flex-wrap gap-4">
        {primary && <Button size="lg" className="h-12 px-8 text-base" variant={isGradient ? "secondary" : "default"} asChild><a href={primary.href} onClick={onPrimaryClick}>{primary.label}</a></Button>}
        {secondary && <Button size="lg" variant={isGradient ? "outline" : "outline"} className="h-12 px-8 text-base" asChild><a href={secondary.href} onClick={onSecondaryClick}>{secondary.label}</a></Button>}
      </div>
      {children}
    </RevealContainer>
  )
}

export function LargeCTA({ title, description, primary, secondary, className }: Omit<CTAProps, "variant">) { return <CTA variant="default" {...{ title, description, primary, secondary, className }} /> }
export function SplitCTA({ left, right, className }: { left: ReactNode; right: ReactNode; className?: string }) {
  return <div className={cn("grid gap-8 rounded-3xl border bg-card p-10 sm:p-16 lg:grid-cols-2 lg:items-center", className)}><div>{left}</div><div className="flex justify-center">{right}</div></div>
}
export function GradientCTA(props: Omit<CTAProps, "variant">) { return <CTA variant="gradient" {...props} /> }
