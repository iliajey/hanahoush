import { useLanguage } from "@/app/language/useLanguage"
import { ServiceCard, ServiceGrid } from "@/components/marketing/services"
import { useServices } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapServices } from "@/features/cms/mappers"

import { SectionHeading, sectionIcon, type SectionProps } from "./common"

interface CoreServiceItem {
  icon?: string
  title?: string
  description?: string
  tags?: string[]
  cta?: { label?: string; href?: string }
}

function isCurated(config: Record<string, unknown>): config is { items: CoreServiceItem[] } {
  return Array.isArray(config.items)
}

/**
 * Services section.
 *
 * With ``config.items`` (curated core services from the page configuration)
 * it renders icon + animation + technology tags + CTA per service; otherwise
 * it falls back to the published services from the CMS API.
 */
export default function ServicesSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const services = useServices({ pageSize: Number(config.page_size ?? 20) })

  if (isCurated(config)) {
    return (
      <section className="border-t py-20 bg-muted/30">
        <SectionHeading config={config} />
        <ServiceGrid className="mt-12">
          {config.items.map((item, i) => {
            const Icon = sectionIcon(item.icon, i)
            return (
              <ServiceCard
                key={`${item.title}-${i}`}
                icon={<Icon className="h-5 w-5" />}
                title={item.title ?? ""}
                description={item.description ?? ""}
                features={item.tags}
                href={item.cta?.href}
              />
            )
          })}
        </ServiceGrid>
      </section>
    )
  }

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={services.isLoading}
        isError={services.isError}
        onRetry={() => services.refetch()}
        isEmpty={!services.data?.items.length}
      >
        <ServiceGrid className="mt-12">
          {mapServices(services.data?.items ?? [], language).map((service, i) => {
            const Icon = sectionIcon(service.iconKey, i)
            return (
              <ServiceCard
                key={service.id}
                icon={<Icon className="h-5 w-5" />}
                title={service.title}
                description={service.description}
                href={service.href}
              />
            )
          })}
        </ServiceGrid>
      </CmsAsync>
    </section>
  )
}