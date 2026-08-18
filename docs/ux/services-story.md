# Services Experience — UX Story

The page reads like a **product presentation**, not a card grid. Each section
advances a narrative: from aspiration to proof.

## The narrative arc

```
I need software that works like a product.
        │
        ▼
1 · HERO      "Services engineered like a product."
        │       cinematic heading · animated background · living cursor
        ▼
2 · JOURNEY   From problem to result — four beats that earn trust.
        │       problem → solution → technology → result
        ▼
3 · CORE      Seven disciplines, one cohesive product.
        │       each with an icon, animation, tags and a clear next step
        ▼
4 · WHY       Traditional vs the Hanahoush approach.
        │       a table that reframes the decision
        ▼
5 · STACK     The technologies we build with (animated).
        ▼
6 · PROCESS   A transparent, seven-stage delivery pipeline.
        │       Discovery → Planning → Architecture → Development → Testing → Deployment → Support
        ▼
7 · FAQ       Answers the practical questions.
        ▼
8 · PROOF     Related projects and articles — real work from the CMS.
        ▼
9 · CTA       "Ready to build something exceptional?"
```

## Principles

- **Purposeful motion only** — reveal-on-scroll (framer-motion `whileInView`),
  subtle stagger; nothing decorative that fights the content. Motion respects
  reduced-motion via the existing design-system conventions.
- **A product, not a catalog** — the hero and journey lead; the core-services
  cards carry clear next actions; the comparison reframes the decision; proof
  (CMS projects + articles) closes the loop.
- **One source of truth** — every section is a backend-configured `PageSection`.
  Copy, order, visibility and the curated service list can change in the admin
  without touching code.

## Accessibility

- Semantic landmarks (`main`, `section`, headings in order).
- Text labels accompany every visual state (badges, step numbers, table rows).
- Color is never the only signal (icons + text).
- `aria-busy` skeletons while lazy sections load.
- Intersection-observers and scroll tracking are passive and non-blocking.

## Motion inventory

| Motion | Where | Purpose |
|---|---|---|
| Reveal on scroll | journey, comparison, stack, process | progressive disclosure |
| Stagger | stack/process grids | scannability |
| Hover lift | core-service cards | affordance |
| Living cursor | global | brand signature |
