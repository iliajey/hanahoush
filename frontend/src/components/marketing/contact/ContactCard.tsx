import { cn } from "@/shared/lib/cn"
import { Mail, MapPin, Phone } from "lucide-react"
import { RevealContainer } from "../common/RevealContainer"

export function ContactCard({ icon, title, content, href, className }: { icon: string; title: string; content: string; href?: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = { mail: <Mail />, phone: <Phone />, map: <MapPin /> }
  return (
    <RevealContainer className={cn("flex items-center gap-4 rounded-2xl border bg-card p-6", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">{icons[icon]}</div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{title}</div>
        {href ? <a href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">{content}</a> : <span className="text-sm font-medium">{content}</span>}
      </div>
    </RevealContainer>
  )
}

export function OfficeCard({ name, address, phone, email, city, className }: { name: string; address: string; phone?: string; email?: string; city?: string; className?: string }) {
  return (
    <RevealContainer className={cn("rounded-2xl border bg-card p-6", className)}>
      <h3 className="mb-1 font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground">{address}{city && <>, {city}</>}</p>
      {phone && <p className="mt-2 text-sm">📞 {phone}</p>}
      {email && <a href={`mailto:${email}`} className="mt-1 block text-sm text-brand-600 hover:underline">{email}</a>}
    </RevealContainer>
  )
}

export function MapPlaceholder({ className }: { className?: string }) {
  return <div className={cn("flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 text-sm text-muted-foreground", className)}>Map</div>
}
