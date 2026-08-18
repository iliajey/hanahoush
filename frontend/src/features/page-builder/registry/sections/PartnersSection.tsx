import { InfiniteLogoSlider } from "@/components/marketing/partners"
import { companyAnalytics } from "@/features/analytics/domains"
import { usePartners } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapPartners } from "@/features/cms/mappers"

import { SectionHeading, type SectionProps } from "./common"

/** Partner logo marquee. */
export default function PartnersSection({ config }: SectionProps) {
  const partners = usePartners()

  return (
    <section className="py-16">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={partners.isLoading}
        isError={partners.isError}
        onRetry={() => partners.refetch()}
        isEmpty={!partners.data?.length}
      >
        <div className="mt-8">
          <InfiniteLogoSlider
            logos={mapPartners(partners.data ?? [])}
            onLogoClick={(name) => companyAnalytics.partnerClick(name)}
          />
        </div>
      </CmsAsync>
    </section>
  )
}
