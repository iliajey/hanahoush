import { Bot, Code2, Cloud, Cpu, Database, Globe, Layers, LineChart, Settings, Shield, Zap, type LucideIcon } from "lucide-react"

import { SectionHeader } from "@/components/marketing/common"
import type { SectionConfig } from "../../types"

export interface SectionProps {
  config: SectionConfig
}

/** Read a (localized) string from a section config with a fallback. */
export function cfgString(config: SectionConfig, key: string, fallback = ""): string {
  const value = config[key]
  return typeof value === "string" && value ? value : fallback
}

/** Build a SectionHeader from common config keys. */
export function SectionHeading({ config }: { config: SectionConfig }) {
  const eyebrow = cfgString(config, "eyebrow")
  const title = cfgString(config, "title")
  const description = cfgString(config, "description")
  if (!title) return null
  return <SectionHeader eyebrow={eyebrow || undefined} title={title} description={description || undefined} />
}

const ICON_MAP: Record<string, LucideIcon> = {
  globe: Globe, layers: Layers, settings: Settings, bot: Bot, code: Code2,
  zap: Zap, database: Database, cloud: Cloud, cpu: Cpu, chart: LineChart, shield: Shield,
}
const FALLBACK_ICONS: LucideIcon[] = [Globe, Layers, Settings, Bot, Code2, Zap]

export function sectionIcon(iconKey: string | undefined, index: number): LucideIcon {
  if (iconKey && ICON_MAP[iconKey.toLowerCase()]) return ICON_MAP[iconKey.toLowerCase()]
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length]
}
