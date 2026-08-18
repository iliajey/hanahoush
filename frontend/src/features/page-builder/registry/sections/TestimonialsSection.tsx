import { TestimonialCard, TestimonialGrid } from "@/components/marketing/testimonials"
import { useTestimonials } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapTestimonials } from "@/features/cms/mappers"

import { SectionHeading, type SectionProps } from "./common"

/** Featured testimonials. */
export default function TestimonialsSection({ config }: SectionProps) {
  const featured = config.featured !== false
  const testimonials = useTestimonials({ is_featured: featured, pageSize: Number(config.limit ?? 3) })

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={testimonials.isLoading}
        isError={testimonials.isError}
        onRetry={() => testimonials.refetch()}
        isEmpty={!testimonials.data?.items.length}
      >
        <TestimonialGrid className="mt-12">
          {mapTestimonials(testimonials.data?.items ?? []).map((item, i) => (
            <TestimonialCard key={i} {...item} />
          ))}
        </TestimonialGrid>
      </CmsAsync>
    </section>
  )
}
