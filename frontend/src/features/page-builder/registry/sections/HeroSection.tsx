import { useTranslation } from "react-i18next"

import { Hero } from "@/components/marketing/hero"
import { useSiteSettings } from "@/features/cms"
import { useHeroConfig } from "../../hooks"

import type { SectionConfig } from "../../types"
import { cfgString, type SectionProps } from "./common"

/** Renders the animated hero from section config (falling back to i18n + hero endpoint). */
export default function HeroSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const hero = useHeroConfig()
  const settings = useSiteSettings()

  const headline = cfgString(config, "headline", t("home.hero.headline"))
  const subtitle = cfgString(config, "subtitle", t("home.hero.subtitle"))
  const align = config.align === "start" ? "start" : "center"

  const primaryLabel =
    (config.primary as SectionConfig | undefined)?.label as string | undefined
  const primaryHref =
    (config.primary as SectionConfig | undefined)?.href as string | undefined
  const secondaryLabel =
    (config.secondary as SectionConfig | undefined)?.label as string | undefined
  const secondaryHref =
    (config.secondary as SectionConfig | undefined)?.href as string | undefined

  const eyebrow = cfgString(config, "eyebrow") || settings.data?.tagline || t("app.tagline")

  return (
    <Hero
      eyebrow={eyebrow}
      headline={headline}
      subtitle={subtitle}
      primaryCta={{
        label: primaryLabel ?? hero.data?.primary_cta_label ?? t("home.hero.primaryCta"),
        href: primaryHref ?? hero.data?.primary_cta_url ?? "/contact",
      }}
      secondaryCta={{
        label: secondaryLabel ?? hero.data?.secondary_cta_label ?? t("home.hero.secondaryCta"),
        href: secondaryHref ?? hero.data?.secondary_cta_url ?? "/services",
      }}
      align={align}
    />
  )
}
