import { useTranslation } from "react-i18next"

import { StatCard, StatGrid } from "@/components/marketing/statistics"
import { useSiteStats } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"

import { cfgString, SectionHeading, type SectionProps } from "./common"

/** Live statistics section — counts derived from real API data. */
export default function StatisticsSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const { stats, isLoading } = useSiteStats()

  const labels = (config.labels as Record<string, string> | undefined) ?? {}
  const statConfig = [
    { key: "projects", label: cfgString(labels, "projects", t("home.stats.projects")), suffix: "+" },
    { key: "articles", label: cfgString(labels, "articles", t("home.stats.articles")), suffix: "" },
    { key: "team", label: cfgString(labels, "team", t("home.stats.team")), suffix: "" },
    { key: "partners", label: cfgString(labels, "partners", t("home.stats.partners")), suffix: "" },
  ] as const

  return (
    <section className="py-20">
      <SectionHeading config={config} />
      <CmsAsync isLoading={isLoading} isError={false} isEmpty={false}>
        <StatGrid className="mt-12">
          {statConfig.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={String(stats.find((s) => s.key === stat.key)?.value ?? 0)}
              suffix={stat.suffix}
            />
          ))}
        </StatGrid>
      </CmsAsync>
    </section>
  )
}
