import { Github, Globe, Instagram, Linkedin, Link, MessageCircle, Send, Twitter, Youtube } from "lucide-react"

import { OfficeCard } from "@/components/marketing/contact"
import { CmsAsync } from "@/features/cms/components"
import { ContactForm } from "@/features/contact"
import { useAbout, useOffices, useSocialLinks } from "@/features/cms"
import type { Office, SocialLink } from "@/features/cms/types"

import { cfgString, SectionHeading, type SectionProps } from "./common"

/** Grid of the about page's values (config-driven, localizable). */
export function ValuesSection({ config }: SectionProps) {
  const values = (config.values as { title?: string; body?: string }[] | undefined) ?? []
  return (
    <section className="border-t py-20">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <div key={index} className="rounded-2xl border bg-card p-6">
              <h3 className="text-lg font-semibold">{value.title}</h3>
              {value.body ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Company narrative from the about page (intro / description). */
export function CompanyStorySection({ config }: SectionProps) {
  const about = useAbout()
  return (
    <section className="py-20">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <CmsAsync isLoading={about.isLoading} isError={about.isError} onRetry={() => about.refetch()} isEmpty={!about.data}>
          {about.data ? (
            <div id="company-story" className="mx-auto mt-10 max-w-3xl">
              <p className="text-lg leading-relaxed text-muted-foreground">{about.data.description}</p>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <article className="rounded-2xl border bg-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    {cfgString(config, "missionLabel", "Mission")}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{about.data.mission}</p>
                </article>
                <article className="rounded-2xl border bg-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    {cfgString(config, "visionLabel", "Vision")}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{about.data.vision}</p>
                </article>
              </div>
            </div>
          ) : null}
        </CmsAsync>
      </div>
    </section>
  )
}

const PLATFORM_ICONS: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  telegram: Send,
  instagram: Instagram,
  x: Twitter,
  youtube: Youtube,
  github: Github,
  whatsapp: MessageCircle,
  website: Globe,
  other: Link,
}

function linkIcon(platform: string) {
  return PLATFORM_ICONS[platform] ?? Link
}

/** Social / external profile links. */
export function SocialLinksSection({ config }: SectionProps) {
  const socials = useSocialLinks()
  return (
    <section className="border-t py-16">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <CmsAsync isLoading={socials.isLoading} isError={socials.isError} onRetry={() => socials.refetch()} isEmpty={!socials.data?.length}>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {(socials.data ?? []).map((link: SocialLink) => {
              const Icon = linkIcon(link.platform)
              return (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label || link.platform}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand-500/40 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {link.label || link.platform}
                  </a>
                </li>
              )
            })}
          </ul>
        </CmsAsync>
      </div>
    </section>
  )
}

/** Physical office locations. */
export function OfficesSection({ config }: SectionProps) {
  const offices = useOffices()
  return (
    <section className="border-t py-20 bg-muted/30">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <CmsAsync isLoading={offices.isLoading} isError={offices.isError} onRetry={() => offices.refetch()} isEmpty={!offices.data?.length}>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(offices.data ?? []).map((office: Office) => (
              <OfficeCard
                key={office.id}
                name={office.name}
                address={office.address}
                city={office.city}
                phone={office.phone}
                email={office.email}
              />
            ))}
          </div>
        </CmsAsync>
      </div>
    </section>
  )
}

/** Production contact / inquiry form (single contact system). */
export function ContactFormSection({ config }: SectionProps) {
  return (
    <section id="contact" className="py-20">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {cfgString(config, "description")}
        </p>
        <div className="mt-10">
          <ContactForm
            config={{
              services: (config.services as string[] | undefined) ?? [],
              projectTypes: (config.projectTypes as string[] | undefined) ?? [],
            }}
          />
        </div>
      </div>
    </section>
  )
}