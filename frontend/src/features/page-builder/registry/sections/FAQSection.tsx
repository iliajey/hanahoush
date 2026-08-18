import { FAQAccordion } from "@/components/marketing/faq"
import { useFAQs } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapFAQs } from "@/features/cms/mappers"
import { trackEvent } from "@/features/analytics"

import { SectionHeading, type SectionProps } from "./common"

/** FAQ accordion (open/close usage tracked). */
export default function FAQSection({ config }: SectionProps) {
  const faqs = useFAQs({ pageSize: Number(config.page_size ?? 20) })

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={faqs.isLoading}
        isError={faqs.isError}
        onRetry={() => faqs.refetch()}
        isEmpty={!faqs.data?.items.length}
      >
        <div className="mt-12 max-w-2xl mx-auto">
          <FAQAccordion
            items={mapFAQs(faqs.data?.items ?? [])}
            onValueChange={(value) => {
              if (value) trackEvent("accordion_open", { item: value })
            }}
          />
        </div>
      </CmsAsync>
    </section>
  )
}
