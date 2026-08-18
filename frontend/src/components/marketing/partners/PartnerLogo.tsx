import { cn } from "@/shared/lib/cn"

interface PartnerLogoItemProps {
  logo: { name: string; src: string }
}

function PartnerLogoItem({ logo }: PartnerLogoItemProps) {
  if (logo.src) {
    return (
      <img src={logo.src} alt={logo.name} loading="lazy" className="max-h-full max-w-full object-contain" />
    )
  }
  return <span className="text-sm font-semibold text-muted-foreground">{logo.name}</span>
}

export function LogoCloud({
  logos,
  className,
  onLogoClick,
}: {
  logos: { name: string; src: string }[]
  className?: string
  onLogoClick?: (name: string) => void
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-8 sm:gap-12", className)}>
      {logos.map((l) => (
        <div
          key={l.name}
          onClick={onLogoClick ? () => onLogoClick(l.name) : undefined}
          className="flex h-12 w-24 items-center justify-center opacity-40 transition-opacity grayscale hover:opacity-80 hover:grayscale-0"
        >
          <PartnerLogoItem logo={l} />
        </div>
      ))}
    </div>
  )
}

export function InfiniteLogoSlider({
  logos,
  className,
  onLogoClick,
}: {
  logos: { name: string; src: string }[]
  className?: string
  onLogoClick?: (name: string) => void
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="flex w-max animate-marquee gap-12 py-4 hover:[animation-play-state:paused]">
        {[...logos, ...logos].map((l, i) => (
          <div
            key={`${l.name}-${i}`}
            onClick={onLogoClick ? () => onLogoClick(l.name) : undefined}
            className="flex h-10 w-28 shrink-0 items-center justify-center opacity-40 grayscale hover:opacity-80 hover:grayscale-0"
          >
            <PartnerLogoItem logo={l} />
          </div>
        ))}
      </div>
    </div>
  )
}
