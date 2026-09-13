import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/shared/lib/cn"

import type { CaseStudyForm, StudioLocale } from "./caseStudy"

function localeDir(locale: StudioLocale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl"
}

/** Simple rich-text/plain toggle for case-study long text: plain textarea
 * plus a localized hint. The narrative body stays in the main description
 * RichTextEditor — these structured fields stay explicit and auditable. */
function LocalizedTextarea({
  id,
  label,
  value,
  onChange,
  locale,
  rows = 3,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  locale: StudioLocale
  rows?: number
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} dir={localeDir(locale)} />
    </div>
  )
}

/** Purpose-built editor for the public case-study sections (Phase 15).
 * Edits challenge / objectives / solution / results / implementation
 * stages / architecture — exactly the sections the public page renders.
 * No generic page builder: one card per public section, fixed order,
 * hide/show per section flag handled by the parent health panel. */
export function CaseStudyEditor({
  form,
  onChange,
  locale,
  hidden,
  onToggleHidden,
}: {
  form: CaseStudyForm
  onChange: (next: CaseStudyForm) => void
  locale: StudioLocale
  hidden: Record<string, boolean>
  onToggleHidden: (key: string) => void
}) {
  const { t } = useTranslation()
  const dir = localeDir(locale)

  const set = (patch: Partial<CaseStudyForm>) => onChange({ ...form, ...patch })

  const moveStage = (index: number, delta: -1 | 1) => {
    const next = index + delta
    if (next < 0 || next >= form.stages.length) return
    const stages = [...form.stages]
    const [moved] = stages.splice(index, 1)
    stages.splice(next, 0, moved)
    set({ stages })
  }

  const moveNode = (index: number, delta: -1 | 1) => {
    const next = index + delta
    if (next < 0 || next >= form.archNodes.length) return
    const archNodes = [...form.archNodes]
    const [moved] = archNodes.splice(index, 1)
    archNodes.splice(next, 0, moved)
    set({ archNodes })
  }

  const sectionCard = (
    key: string,
    titleKey: string,
    hintKey: string,
    children: React.ReactNode,
  ) => (
    <Card className={cn(hidden[key] && "opacity-70")}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t(titleKey)}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleHidden(key)}
            aria-pressed={!hidden[key]}
            title={t(hintKey)}
          >
            {hidden[key] ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            <span className="sr-only">{t(hintKey)}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  )

  return (
    <div className="grid gap-4" dir={dir}>
      {sectionCard(
        "challenge",
        "studio.caseStudy.challenge",
        "studio.caseStudy.toggleVisibility",
        <LocalizedTextarea
          id="cs-challenge"
          label={t("studio.caseStudy.challengeBody")}
          value={form.challenge[locale]}
          onChange={(value) => set({ challenge: { ...form.challenge, [locale]: value } })}
          locale={locale}
        />,
      )}

      {sectionCard(
        "objectives",
        "studio.caseStudy.objectives",
        "studio.caseStudy.toggleVisibility",
        <LocalizedTextarea
          id="cs-objectives"
          label={t("studio.caseStudy.objectivesBody")}
          value={form.objectives[locale]}
          onChange={(value) => set({ objectives: { ...form.objectives, [locale]: value } })}
          locale={locale}
        />,
      )}

      {sectionCard(
        "solution",
        "studio.caseStudy.solution",
        "studio.caseStudy.toggleVisibility",
        <LocalizedTextarea
          id="cs-solution"
          label={t("studio.caseStudy.solutionBody")}
          value={form.solution[locale]}
          onChange={(value) => set({ solution: { ...form.solution, [locale]: value } })}
          locale={locale}
          rows={4}
        />,
      )}

      {sectionCard(
        "stages",
        "studio.caseStudy.stages",
        "studio.caseStudy.toggleVisibility",
        <>
          {form.stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("studio.caseStudy.stagesEmpty")}</p>
          ) : (
            <ol className="grid gap-3">
              {form.stages.map((entry, index) => (
                <li key={index} className="grid gap-2 rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t("studio.caseStudy.stageN", { count: index + 1 })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveStage(index, -1)}
                        aria-label={t("studio.caseStudy.moveUp")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={index === form.stages.length - 1}
                        onClick={() => moveStage(index, 1)}
                        aria-label={t("studio.caseStudy.moveDown")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          set({ stages: [...form.stages.slice(0, index + 1), { ...form.stages[index] }, ...form.stages.slice(index + 1)] })
                        }
                        aria-label={t("studio.caseStudy.duplicate")}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => set({ stages: form.stages.filter((_, i) => i !== index) })}
                        aria-label={t("studio.caseStudy.remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`cs-stage-${index}`}>{t("studio.caseStudy.stageTitle")}</Label>
                    <Input
                      id={`cs-stage-${index}`}
                      value={entry.stage[locale]}
                      onChange={(e) =>
                        set({
                          stages: form.stages.map((s, i) =>
                            i === index ? { ...s, stage: { ...s.stage, [locale]: e.target.value } } : s,
                          ),
                        })
                      }
                      dir={localeDir(locale)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`cs-stage-detail-${index}`}>{t("studio.caseStudy.stageDetail")}</Label>
                    <Textarea
                      id={`cs-stage-detail-${index}`}
                      rows={2}
                      value={entry.detail[locale]}
                      onChange={(e) =>
                        set({
                          stages: form.stages.map((s, i) =>
                            i === index ? { ...s, detail: { ...s.detail, [locale]: e.target.value } } : s,
                          ),
                        })
                      }
                      dir={localeDir(locale)}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                set({
                  stages: [
                    ...form.stages,
                    { stage: { fa: "", en: "", ar: "" }, detail: { fa: "", en: "", ar: "" } },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("studio.caseStudy.addStage")}
            </Button>
          </div>
        </>,
      )}

      {sectionCard(
        "architecture",
        "studio.caseStudy.architecture",
        "studio.caseStudy.toggleVisibility",
        <>
          <LocalizedTextarea
            id="cs-arch-desc"
            label={t("studio.caseStudy.archDescription")}
            value={form.archDescription[locale]}
            onChange={(value) => set({ archDescription: { ...form.archDescription, [locale]: value } })}
            locale={locale}
          />
          {form.archNodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("studio.caseStudy.nodesEmpty")}</p>
          ) : (
            <ol className="grid gap-3">
              {form.archNodes.map((node, index) => (
                <li key={index} className="grid gap-2 rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t("studio.caseStudy.nodeN", { count: index + 1 })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveNode(index, -1)}
                        aria-label={t("studio.caseStudy.moveUp")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={index === form.archNodes.length - 1}
                        onClick={() => moveNode(index, 1)}
                        aria-label={t("studio.caseStudy.moveDown")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => set({ archNodes: form.archNodes.filter((_, i) => i !== index) })}
                        aria-label={t("studio.caseStudy.remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`cs-node-${index}`}>{t("studio.caseStudy.nodeLayer")}</Label>
                    <Input
                      id={`cs-node-${index}`}
                      value={node.layer}
                      onChange={(e) =>
                        set({
                          archNodes: form.archNodes.map((n, i) =>
                            i === index ? { ...n, layer: e.target.value } : n,
                          ),
                        })
                      }
                      dir="ltr"
                      placeholder="backend"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`cs-node-labels-${index}`}>{t("studio.caseStudy.nodeLabels")}</Label>
                    <Textarea
                      id={`cs-node-labels-${index}`}
                      rows={2}
                      value={node.labels[locale]}
                      onChange={(e) =>
                        set({
                          archNodes: form.archNodes.map((n, i) =>
                            i === index ? { ...n, labels: { ...n.labels, [locale]: e.target.value } } : n,
                          ),
                        })
                      }
                      dir={localeDir(locale)}
                      placeholder={t("studio.caseStudy.nodeLabelsHint")}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                set({ archNodes: [...form.archNodes, { layer: "", labels: { fa: "", en: "", ar: "" } }] })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("studio.caseStudy.addNode")}
            </Button>
          </div>
        </>,
      )}

      {sectionCard(
        "results",
        "studio.caseStudy.results",
        "studio.caseStudy.toggleVisibility",
        <LocalizedTextarea
          id="cs-results"
          label={t("studio.caseStudy.resultsBody")}
          value={form.results[locale]}
          onChange={(value) => set({ results: { ...form.results, [locale]: value } })}
          locale={locale}
          rows={4}
        />,
      )}
    </div>
  )
}
