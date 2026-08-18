import { useTranslation } from "react-i18next"

import { Card, CardContent } from "@/components/ui/card"
import { useAbout } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"

import { SectionHeading, type SectionProps } from "./common"

/** About section — mission & vision from the about page. */
export default function AboutSection({ config }: SectionProps) {
  const { t } = useTranslation()
  const about = useAbout()

  return (
    <section className="py-20">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={about.isLoading}
        isError={about.isError}
        onRetry={() => about.refetch()}
        isEmpty={!about.data}
      >
        {about.data ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <CardContent className="flex flex-col gap-3 p-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {t("home.about.mission")}
                </span>
                <p className="text-lg leading-relaxed text-muted-foreground">{about.data.mission}</p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="flex flex-col gap-3 p-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {t("home.about.vision")}
                </span>
                <p className="text-lg leading-relaxed text-muted-foreground">{about.data.vision}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </CmsAsync>
    </section>
  )
}
