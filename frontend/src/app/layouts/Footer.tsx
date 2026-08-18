import { useTranslation } from "react-i18next"
import { AtSign, Github, Globe, Instagram, Linkedin, MessageCircle, Send, Youtube, type LucideIcon } from "lucide-react"

import { Container } from "@/components/layout"
import { EnterpriseFooter } from "@/components/marketing/footer"
import { useFooter } from "@/features/cms"
import { mapFooter } from "@/features/cms/mappers"

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  instagram: Instagram,
  telegram: Send,
  x: AtSign,
  youtube: Youtube,
  github: Github,
  whatsapp: MessageCircle,
  website: Globe,
  other: Globe,
}

/**
 * App footer. Driven entirely by the `/api/v1/footer/` endpoint (columns,
 * social links, company info). Falls back to a slim i18n bar while loading
 * so navigation never goes blank.
 */
export function Footer() {
  const { t } = useTranslation()
  const footer = useFooter()

  if (!footer.data) {
    return (
      <footer className="border-t py-8">
        <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("app.title")}
          </p>
          <p className="text-sm text-muted-foreground">{t("app.tagline")}</p>
        </Container>
      </footer>
    )
  }

  const view = mapFooter(footer.data)
  return (
    <EnterpriseFooter
      columns={view.columns}
      socials={view.socials.map((social) => {
        const Icon = PLATFORM_ICONS[social.platform] ?? Globe
        return { label: social.label, href: social.href, icon: <Icon className="h-4 w-4" /> }
      })}
      company={view.company}
    />
  )
}