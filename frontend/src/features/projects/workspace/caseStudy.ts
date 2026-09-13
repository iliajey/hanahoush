import type { CaseStudyRaw, LocalizedText } from "../api/staff"

export type StudioLocale = "fa" | "en" | "ar"

export const CASE_STUDY_LOCALES: StudioLocale[] = ["fa", "en", "ar"]

/** Read one locale's value out of a localized leaf (plain string wins). */
export function localizedLeaf(value: LocalizedText | undefined, locale: StudioLocale): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  return value[locale] ?? value.en ?? value.fa ?? value.ar ?? ""
}

/** True when a leaf has any non-blank text in any locale. */
export function leafHasText(value: LocalizedText | undefined): boolean {
  if (typeof value === "string") return value.trim().length > 0
  if (value && typeof value === "object") {
    return (["fa", "en", "ar"] as const).some((locale) => (value[locale] ?? "").trim().length > 0)
  }
  return false
}

function buildLeaf(en: string, fa: string, ar: string): LocalizedText | undefined {
  const trimmed = { en: en.trim(), fa: fa.trim(), ar: ar.trim() }
  if (!trimmed.en && !trimmed.fa && !trimmed.ar) return undefined
  // All-identical content collapses to a plain string (public shape supports both).
  if (trimmed.en && trimmed.en === trimmed.fa && trimmed.en === trimmed.ar) return trimmed.en
  const out: Record<string, string> = {}
  if (trimmed.en) out.en = trimmed.en
  if (trimmed.fa) out.fa = trimmed.fa
  if (trimmed.ar) out.ar = trimmed.ar
  return out as LocalizedText
}

function textFromLeaf(value: LocalizedText | undefined, locale: StudioLocale): string {
  return localizedLeaf(value, locale)
}

function setLeafText(value: LocalizedText | undefined, locale: StudioLocale, text: string): LocalizedText | undefined {
  if (typeof value === "string") {
    if (locale === "en") return text.trim() ? text : undefined
    const out: Record<string, string> = { en: value }
    if (text.trim()) out[locale] = text
    return Object.keys(out).length ? (out as LocalizedText) : undefined
  }
  const current = (value ?? {}) as Record<string, string>
  const next: Record<string, string> = { ...current }
  if (text.trim()) next[locale] = text
  else delete next[locale]
  return Object.keys(next).length ? (next as LocalizedText) : undefined
}

/** Flat per-locale editor form for the whole case study. The editor shows
 * one locale at a time; this shape keeps all three so switching never
 * loses unsaved content. */
export interface CaseStudyForm {
  challenge: Record<StudioLocale, string>
  objectives: Record<StudioLocale, string>
  solution: Record<StudioLocale, string>
  results: Record<StudioLocale, string>
  archDescription: Record<StudioLocale, string>
  stages: Array<{ stage: Record<StudioLocale, string>; detail: Record<StudioLocale, string> }>
  archNodes: Array<{ layer: string; labels: Record<StudioLocale, string> }>
}

const emptyLocales = (): Record<StudioLocale, string> => ({ fa: "", en: "", ar: "" })

export function emptyCaseStudyForm(): CaseStudyForm {
  return {
    challenge: emptyLocales(),
    objectives: emptyLocales(),
    solution: emptyLocales(),
    results: emptyLocales(),
    archDescription: emptyLocales(),
    stages: [],
    archNodes: [],
  }
}

/** Hydrate the editor form from the staff API's raw (unresolved) JSON. */
export function caseStudyToForm(raw: CaseStudyRaw | null | undefined): CaseStudyForm {
  const form = emptyCaseStudyForm()
  if (!raw) return form
  for (const locale of CASE_STUDY_LOCALES) {
    form.challenge[locale] = textFromLeaf(raw.challenge, locale)
    form.objectives[locale] = textFromLeaf(raw.objectives, locale)
    form.solution[locale] = textFromLeaf(raw.solution_approach, locale)
    form.results[locale] = textFromLeaf(raw.results, locale)
    form.archDescription[locale] = textFromLeaf(raw.architecture?.description, locale)
  }
  for (const entry of raw.implementation_stages ?? []) {
    form.stages.push({
      stage: {
        fa: textFromLeaf(entry.stage, "fa"),
        en: textFromLeaf(entry.stage, "en"),
        ar: textFromLeaf(entry.stage, "ar"),
      },
      detail: {
        fa: textFromLeaf(entry.detail, "fa"),
        en: textFromLeaf(entry.detail, "en"),
        ar: textFromLeaf(entry.detail, "ar"),
      },
    })
  }
  for (const node of raw.architecture?.nodes ?? []) {
    const pick = (locale: StudioLocale): string => {
      const labels = node.labels as unknown
      if (Array.isArray(labels)) {
        // Mixed arrays: plain strings shared, localized objects resolved.
        return labels
          .map((label: unknown) =>
            typeof label === "string"
              ? label
              : localizedLeaf(label as LocalizedText, locale),
          )
          .filter(Boolean)
          .join("\n")
      }
      if (labels && typeof labels === "object") {
        const perLocale = labels as Record<string, string[]>
        return (perLocale[locale] ?? perLocale.en ?? []).join("\n")
      }
      return ""
    }
    form.archNodes.push({
      layer: node.layer ?? "",
      labels: { fa: pick("fa"), en: pick("en"), ar: pick("ar") },
    })
  }
  return form
}

/** Serialize the editor form back to the API's localized JSON shape. */
export function formToCaseStudy(form: CaseStudyForm): CaseStudyRaw | null {
  const out: CaseStudyRaw = {}
  const challenge = buildLeaf(form.challenge.en, form.challenge.fa, form.challenge.ar)
  const objectives = buildLeaf(form.objectives.en, form.objectives.fa, form.objectives.ar)
  const solution = buildLeaf(form.solution.en, form.solution.fa, form.solution.ar)
  const results = buildLeaf(form.results.en, form.results.fa, form.results.ar)
  if (challenge) out.challenge = challenge
  if (objectives) out.objectives = objectives
  if (solution) out.solution_approach = solution
  if (results) out.results = results

  const stages = form.stages
    .map((entry) => ({
      stage: buildLeaf(entry.stage.en, entry.stage.fa, entry.stage.ar),
      detail: buildLeaf(entry.detail.en, entry.detail.fa, entry.detail.ar),
    }))
    .filter((entry) => entry.stage != null || entry.detail != null)
    .map((entry) => ({ stage: entry.stage ?? "", detail: entry.detail ?? "" }))
  if (stages.length) out.implementation_stages = stages

  const nodes = form.archNodes
    .map((node) => {
      // One label per line in the editor -> plain-string array shared
      // across locales; the public viewer renders arrays verbatim.
      const lines = (node.labels.en || node.labels.fa || node.labels.ar)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      return { layer: node.layer.trim(), labels: lines }
    })
    .filter((node) => node.layer.length > 0)
  const archDescription = buildLeaf(
    form.archDescription.en,
    form.archDescription.fa,
    form.archDescription.ar,
  )
  if (archDescription != null || nodes.length > 0) {
    out.architecture = {
      ...(archDescription != null ? { description: archDescription } : {}),
      nodes,
    }
  }
  return Object.keys(out).length ? out : null
}

export { setLeafText }

export function caseStudyHasText(raw: CaseStudyRaw | null | undefined): boolean {
  if (!raw) return false
  if ([raw.challenge, raw.objectives, raw.solution_approach, raw.results].some(leafHasText)) return true
  if ((raw.implementation_stages ?? []).some((entry) => leafHasText(entry.stage) || leafHasText(entry.detail))) {
    return true
  }
  if (leafHasText(raw.architecture?.description)) return true
  return (raw.architecture?.nodes ?? []).length > 0
}
