import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { companyAnalytics } from "@/features/analytics/domains"
import { useTeam } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"

import { SectionHeading, type SectionProps } from "./common"

/** Team members grid. */
export default function TeamSection({ config }: SectionProps) {
  const team = useTeam()

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={team.isLoading}
        isError={team.isError}
        onRetry={() => team.refetch()}
        isEmpty={!team.data?.length}
      >
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(team.data ?? []).slice(0, Number(config.limit ?? 6)).map((member) => (
            <div
              key={member.id}
              onClick={() => companyAnalytics.teamMemberClick(member.id)}
              className="flex cursor-default items-center gap-4 rounded-2xl border bg-card p-6"
            >
              <Avatar className="h-14 w-14">
                <AvatarImage src={member.avatar?.file} alt={member.name} />
                <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-sm text-muted-foreground">{member.position}</div>
              </div>
            </div>
          ))}
        </div>
      </CmsAsync>
    </section>
  )
}
