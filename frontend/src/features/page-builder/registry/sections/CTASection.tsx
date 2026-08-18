import { GradientCTA } from "@/components/marketing/cta"
import { trackEvent } from "@/features/analytics"

import { cfgString, type SectionProps } from "./common"

/** Call-to-action band — copy driven by the section config (CTA clicks tracked). */
export default function CTASection({ config }: SectionProps) {
  const title = cfgString(config, "title", "Ready to build something exceptional?")
  const description = cfgString(config, "description")
  const primary = config.primary as { label?: string; href?: string } | undefined
  const secondary = config.secondary as { label?: string; href?: string } | undefined

  return (
    <GradientCTA
      title={title}
      description={description || undefined}
      primary={{ label: primary?.label ?? "Start a project", href: primary?.href ?? "/contact" }}
      secondary={{ label: secondary?.label ?? "Talk to engineering", href: secondary?.href ?? "/contact" }}
      onPrimaryClick={() => trackEvent("cta_click", { cta: "primary", label: primary?.label })}
      onSecondaryClick={() => trackEvent("cta_click", { cta: "secondary", label: secondary?.label })}
    />
  )
}
