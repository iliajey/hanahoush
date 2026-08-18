import { useTranslation } from "react-i18next"

import { ERPFeatureCard, ERPModules } from "@/components/marketing/erp"
import { sectionIcon, SectionHeading, type SectionProps } from "./common"

/** hanRP product section — copy and module list come from the section config. */
export default function ERPSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const features = Array.isArray(config.features) ? (config.features as Array<Record<string, string>>) : []
  const modules = Array.isArray(config.modules)
    ? (config.modules as Array<{ name: string; status: "live" | "soon" }>)
    : []

  return (
    <section className="py-20">
      <SectionHeading config={config} />
      {features.length > 0 && (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = sectionIcon(feature.icon, i)
            return (
              <ERPFeatureCard
                key={`${feature.title}-${i}`}
                icon={<Icon className="h-5 w-5" />}
                title={feature.title}
                description={feature.description}
              />
            )
          })}
        </div>
      )}
      {modules.length > 0 && (
        <div className="mt-8">
          <ERPModules modules={modules} />
        </div>
      )}
      {features.length === 0 && modules.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("common.empty")}</p>
      ) : null}
    </section>
  )
}
