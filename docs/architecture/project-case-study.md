# Project Case Study — Architecture (ADR-style)

## Status

Accepted for Phase 8E.

## Context

The platform already has: Project/ProjectImage/Technology models + APIs
(Phase 4), a CMS hook layer (8A), the Page Builder + section registry (8B),
the editorial workflow (8C) and the services experience (8D). A premium
projects/case-study experience must reuse all of these — no parallel CMS, no
second renderer.

## Decisions

### 1. Case-study content is a structured JSONField on Project

`Project.case_study` holds `challenge`, `objectives`, `solution_approach`,
`architecture`, `implementation_stages`, `results` — a single added field
(rather than 6 columns/tables). Rationale:
- These are free-form, per-project narrative blocks that are **structurally
  stable** (a documented JSON contract) but content-free-form.
- A JSONField here is justified: the shape is static and documented, values
  are free text, and per-locale objects are flattened at request time by the
  existing `resolve_localized`.
- No HTML blobs stored: values are plain text paragraphs / small arrays.

Alternative considered and rejected: six columns (`challenge_fa/en/ar`, …) —
synchronous schema churn for content that the workflow + admin already handle
as JSON.

### 2. Case-study detail is fetched by slug via a new action

`GET /api/v1/projects/by-slug/{slug}/` returns the `ProjectDetailSerializer`
(draft-protected). The primary lookup stays pk-based for backward
compatibility; slug lookup is an additional named action, not a duplicate
endpoint.

### 3. Related content is computed server-side in the detail serializer

`related_projects` (category or shared technology, excluding self, limit 3)
and `related_articles` (published articles whose tags overlap the project's
technologies, limit 3). This keeps relationships honest and over the wire
without a separate endpoint or brittle client-side matching.

### 4. The case study is a page assembled by PageRenderer

`ProjectCaseStudyPage` builds a Page-shaped object whose 12 sections carry
`config.projectSlug`; the registry maps each `case_*` section type to a thin
component that renders the reusable project component. This reuses
`PageRenderer`, lazy chunks, `SectionBoundary`, and the unknown-section
fallback — there is no second renderer.

### 5. Technologies/categories are served for the explorer

`GET /api/v1/projects/technologies/` and `/projects/categories/` return the
actual taxonomy used by published projects (with counts). The filter pickers
and explorer render these — nothing hardcoded.

## Consequences

- Public endpoints remain draft-protected (published-only querysets).
- Analytics reuse the single `features/analytics` system with the new
  project event names.
- Case-study sections are lazy-loaded like every other section.