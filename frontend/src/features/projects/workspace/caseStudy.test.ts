import { describe, expect, it } from "vitest"

import {
  caseStudyHasText,
  caseStudyToForm,
  emptyCaseStudyForm,
  formToCaseStudy,
  leafHasText,
  localizedLeaf,
} from "./caseStudy"

describe("caseStudy helpers (Phase 15 parity)", () => {
  it("resolves localized leaves with en fallback", () => {
    expect(localizedLeaf({ en: "Shop", fa: "فروشگاه" }, "fa")).toBe("فروشگاه")
    expect(localizedLeaf({ en: "Shop" }, "ar")).toBe("Shop")
    expect(localizedLeaf("plain", "fa")).toBe("plain")
    expect(localizedLeaf(undefined, "en")).toBe("")
  })

  it("round-trips stages and architecture nodes", () => {
    const raw = {
      challenge: { en: "Legacy checkout.", fa: "تسویه‌حساب قدیمی." },
      implementation_stages: [{ stage: { en: "Design" }, detail: { en: "UX first." } }],
      architecture: { nodes: [{ layer: "Backend", labels: ["Django", "PostgreSQL"] }] },
      results: { en: "+40% conversion." },
    }
    const form = caseStudyToForm(raw)
    expect(form.challenge.fa).toBe("تسویه‌حساب قدیمی.")
    expect(form.stages).toHaveLength(1)
    expect(form.archNodes).toHaveLength(1)
    expect(form.archNodes[0].layer).toBe("Backend")

    const back = formToCaseStudy(form)
    expect(back).not.toBeNull()
    expect(back?.implementation_stages).toHaveLength(1)
    expect(back?.architecture?.nodes?.[0].layer).toBe("Backend")
    expect(caseStudyHasText(back)).toBe(true)
  })

  it("returns null for an empty form and detects text", () => {
    expect(formToCaseStudy(emptyCaseStudyForm())).toBeNull()
    expect(caseStudyHasText(null)).toBe(false)
    expect(leafHasText("  ")).toBe(false)
    expect(leafHasText({ en: "x" })).toBe(true)
  })

  it("collapses identical trilingual text to a plain string", () => {
    const form = emptyCaseStudyForm()
    form.results = { en: "Done", fa: "Done", ar: "Done" }
    const back = formToCaseStudy(form)
    expect(back?.results).toBe("Done")
  })
})
