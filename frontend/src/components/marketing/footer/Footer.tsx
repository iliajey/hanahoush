import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand/BrandLogo"

interface FooterColumn { title: string; links: { label: string; href: string }[] }

type NewsletterStatus = { kind: "idle" } | { kind: "loading" } | { kind: "success" } | { kind: "error" }

export function EnterpriseFooter({ columns, socials, newsletter, company, className }: {
  columns: FooterColumn[]; socials?: { label: string; href: string; icon: React.ReactNode }[]; newsletter?: { placeholder: string; onSubmit: (email: string) => Promise<string | null> | void }; company?: { name: string; year: number }; className?: string
}) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<NewsletterStatus>({ kind: "idle" })

  const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//")

  const handleSubscribe = async (event: FormEvent) => {
    event.preventDefault()
    if (!newsletter || !email.trim() || status.kind === "loading") return
    setStatus({ kind: "loading" })
    try {
      const message = await newsletter.onSubmit(email.trim())
      if (message) setStatus({ kind: "error" })
      else {
        setStatus({ kind: "success" })
        setEmail("")
      }
    } catch {
      setStatus({ kind: "error" })
    }
  }

  return (
    <footer className={cn("relative overflow-hidden border-t py-16", className)}>
      {/* Brand signature hairline */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-600/50 to-transparent"
      />
      <div className="container-hanahoush">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {isInternal(link.href) ? (
                      <Link to={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        title={link.label}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {newsletter ? (
            <div className="sm:col-span-2 lg:col-span-1">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("footer.heading")}</h4>
              {status.kind === "success" ? (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t("footer.subscribed")}
                </p>
              ) : (
                <form onSubmit={(e) => void handleSubscribe(e)} className="flex gap-2" aria-label={t("footer.heading")}>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={newsletter.placeholder}
                    className="h-9"
                    disabled={status.kind === "loading"}
                    aria-label={t("footer.emailLabel")}
                  />
                  <Button type="submit" size="sm" className="h-9" disabled={status.kind === "loading" || !email.trim()}>
                    {status.kind === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("footer.subscribe")}
                  </Button>
                </form>
              )}
              <p className="mt-2 text-sm text-destructive" role="alert" aria-live="polite">
                {status.kind === "error" ? t("footer.subscribeError") : null}
              </p>
            </div>
          ) : null}
        </div>
        {company ? (
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <BrandLogo alt={company.name} className="h-7 w-auto" />
              <p className="text-sm text-muted-foreground">© {company.year} {company.name}. {t("footer.rights")}</p>
            </div>
            {socials ? (
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </footer>
  )
}
