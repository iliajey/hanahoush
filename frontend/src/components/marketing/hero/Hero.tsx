import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/shared/lib/cn"
import { Button } from "@/components/ui/button"
import { AnimatedGrid, GradientMesh } from "@/design/background"
import { RevealContainer } from "../common/RevealContainer"

export interface HeroProps {
  eyebrow?: string
  headline: string
  subtitle?: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  children?: ReactNode
  align?: "center" | "start"
  className?: string
}

export function Hero({
  eyebrow,
  headline,
  subtitle,
  primaryCta,
  secondaryCta,
  children,
  align = "center",
  className,
}: HeroProps) {
  return (
    <section className={cn("relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32", className)}>
      <AnimatedGrid className="absolute inset-0 opacity-40" />
      <GradientMesh className="absolute inset-0" />
      <div className="container-hanahoush relative z-10">
        <div className={cn("flex flex-col gap-8", align === "center" && "items-center text-center")}>
          {eyebrow ? (
            <motion.span
              className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-card/60 px-4 py-1.5 text-sm font-medium backdrop-blur"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              {eyebrow}
            </motion.span>
          ) : null}

          <motion.h1
            className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {headline}
          </motion.h1>

          {subtitle ? (
            <motion.p
              className="max-w-2xl text-lg text-muted-foreground sm:text-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          ) : null}

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {primaryCta ? (
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <a href={primaryCta.href}>{primaryCta.label}</a>
              </Button>
            ) : null}
            {secondaryCta ? (
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <a href={secondaryCta.href}>{secondaryCta.label}</a>
              </Button>
            ) : null}
          </motion.div>

          {children}
        </div>
      </div>
    </section>
  )
}

export { RevealContainer as HeroReveal }
