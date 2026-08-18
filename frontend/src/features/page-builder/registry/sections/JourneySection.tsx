import { motion } from "framer-motion"
import { AlertTriangle, Cpu, Lightbulb, TrendingUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/cn"
import { GradientMesh } from "@/design/background"

import { SectionHeading, type SectionProps } from "./common"

const STEP_ICONS: Record<string, LucideIcon> = {
  alert: AlertTriangle,
  lightbulb: Lightbulb,
  cpu: Cpu,
  trending: TrendingUp,
}

interface JourneyStep {
  key?: string
  icon?: string
  title?: string
  body?: string
}

const STEP_NUMBER = ["01", "02", "03", "04"]

/** Service Journey — Problem → Solution → Technology → Result storytelling. */
export default function JourneySection({ config }: SectionProps) {
  const steps = Array.isArray(config.steps) ? (config.steps as JourneyStep[]) : []

  return (
    <section className="relative overflow-hidden py-24">
      <GradientMesh className="absolute inset-0 opacity-40" />
      <div className="container-hanahoush relative z-10">
        <SectionHeading config={config} />
        <div className="relative mt-16 space-y-12 before:absolute before:inset-y-0 before:left-1/2 before:hidden before:w-px before:-translate-x-1/2 before:bg-border lg:before:block">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[step.icon ?? ""] ?? Cpu
            const reverse = i % 2 === 1
            return (
              <motion.div
                key={step.key ?? i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className={cn(
                  "grid items-center gap-8 lg:grid-cols-2",
                  reverse && "lg:direction-rtl",
                )}
              >
                <div className={cn(reverse && "lg:col-start-2")}>
                  <div className="relative rounded-2xl border bg-card p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{STEP_NUMBER[i]}</span>
                    <h3 className="mt-1 text-2xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-muted-foreground">{step.body}</p>
                  </div>
                </div>
                <div className={cn("hidden lg:flex lg:items-center lg:justify-center", reverse && "lg:col-start-1 lg:row-start-1")}>
                  <span className="text-8xl font-black text-brand-500/10">{STEP_NUMBER[i]}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}