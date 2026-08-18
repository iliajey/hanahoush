import { useLanguage } from "@/app/language/useLanguage"
import { VerticalTimeline } from "@/components/marketing/timeline"
import { companyAnalytics } from "@/features/analytics/domains"
import { useTimeline } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapTimelineEntries } from "@/features/cms/mappers"

import { SectionHeading, type SectionProps } from "./common"

/** Company milestones timeline. */
export default function TimelineSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const timeline = useTimeline()

  return (
    <section className="py-20" onClick={() => companyAnalytics.timelineInteraction(0)}>
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={timeline.isLoading}
        isError={timeline.isError}
        onRetry={() => timeline.refetch()}
        isEmpty={!timeline.data?.length}
      >
        <div className="mt-12 max-w-2xl mx-auto">
          <VerticalTimeline items={mapTimelineEntries(timeline.data ?? [], language)} />
        </div>
      </CmsAsync>
    </section>
  )
}
