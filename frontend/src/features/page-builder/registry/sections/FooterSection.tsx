import { Globe } from "lucide-react"

import { EnterpriseFooter } from "@/components/marketing/footer"
import { useFooter } from "@/features/cms"
import { mapFooter } from "@/features/cms/mappers"
import { Skeleton } from "@/components/ui/skeleton"

import type { SectionProps } from "./common"

/** Footer-as-a-section — columns/socials/company driven by the footer config. */
export default function FooterSection({ config: _config }: SectionProps) {
  const footer = useFooter()

  if (!footer.data) {
    return (
      <footer className="border-t py-8">
        <div className="container-hanahoush">
          <Skeleton className="h-4 w-48" />
        </div>
      </footer>
    )
  }
  const view = mapFooter(footer.data)
  return (
    <EnterpriseFooter
      columns={view.columns}
      socials={view.socials.map((s) => ({ label: s.label, href: s.href, icon: <Globe className="h-4 w-4" /> }))}
      company={view.company}
    />
  )
}
