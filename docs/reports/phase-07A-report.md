# Hanahoush — Phase 7A Report: Product Design & UX Architecture

> Date: 2025-08-04 · Scope: documentation and UX architecture ONLY (no code).

---

## Executive Summary

Phase 7A converted the Hanahoush vision into a **complete, implementation-ready
UX specification**. Twelve design documents now define the sitemap, every page
(purpose, CTAs, states, SEO, animations, API dependencies), the landing page
section-by-section, navigation, motion, design language, brand palette,
responsive and multilingual strategies, a ~64-component map, and a phased build
roadmap (7B–9). The quality target is a premium product-grade site comparable to
Stripe, Linear, Framer, Raycast, Vercel and Clerk — not a traditional corporate
website.

## Files Created

- `docs/design/product-vision.md`
- `docs/design/ux-specification.md`
- `docs/design/information-architecture.md`
- `docs/design/navigation-system.md`
- `docs/design/motion-system.md`
- `docs/design/design-language.md`
- `docs/design/component-map.md`
- `docs/design/responsive-strategy.md`
- `docs/design/multilingual-strategy.md`
- `docs/design/implementation-roadmap.md`
- `docs/design/brand-guidelines.md`
- `docs/design/landing-page-specification.md`
- `docs/reports/phase-07A-report.md` (this report)

## Files Modified

- `CHANGELOG.md` — added Phase 7A entry.
- `docs/reports/next-phase.md` — updated to prepare Phase 7B.

## Document Count

- **12** design documents in `docs/design/` + 1 phase report.
- **Total markdown words across the 12 docs: ~7,200** (~40+ pages of prose).

## Research Summary

- Benchmarked premium software-company sites (Stripe, Linear, Framer, Raycast,
  Vercel, Clerk and others) for hero, motion, typography, and proof patterns.
- Identified that enterprise buyers need: instant value, demonstrable proof,
  credibility signals, and low-friction contact.
- Concluded Hanahoush's differentiator is **product-grade quality + a named
  ERP product (hanRP) + RTL-first multi-language** — rarely combined in the
  regional market.

## UX Decisions

- **One primary CTA per page/section**, always outcome-based ("Start a project",
  "Request a proposal", "Get an estimate").
- **Proof over adjectives** — statistics, projects, testimonials, partners, and
  a timeline carry credibility.
- **Clean sitemap** — Home, Services(+detail), Projects(+detail), Articles(+detail,
  category, tag), About, Contact, Search, Auth (login/forgot/reset), Dashboard,
  404, Privacy, Terms.
- **Premium, calm, modern** aesthetic — tight tracking, generous spacing, soft
  indigo-tinted shadows, restrained glassmorphism, minimal decorative motion.

## Motion Decisions

- Motion is **purposeful and fast** (≤300 ms UI, ≤600 ms reveals, ≤900 ms hero).
- Effects designed: mouse glow, cursor orb, parallax, hero stagger/tilt, card
  hover/zoom, scroll reveals, count-up statistics, marquees, page transitions,
  branded loading.
- **Reduced-motion mode** collapses everything to opacity fades; mouse/pointer
  effects gated to fine pointers and non-mobile.

## Accessibility Decisions

- Keyboard navigation + roving focus for mega menu, drawer, dropdowns, accordions.
- ARIA roles/`aria-expanded`/`aria-haspopup`/`aria-current` throughout.
- Semantics: `nav`, `main`, `footer`, landmarks; ErrorBoundary fallback.
- Contrast ≥ WCAG AA (light + dark), focus rings always, `prefers-reduced-motion`
  respected.

## Responsive Decisions

- Mobile-first, breakpoint-up: mobile → tablet → laptop → desktop → ultra-wide.
- Grid maps and stacked/split layouts defined per tier; pointer effects only on
  fine-pointer devices; performance guardrails (lazy images, font display swap,
  critical CSS).

## SEO Decisions

- Home/services highest importance with `Organization`, `Service`, `FAQPage`,
  `Project`, and `Article` structured data; canonical + breadcrumb; clean URLs.
- Content engine = articles (thought leadership + organic traffic).
- Auth/dashboard/search/404 are noindex.

## Multilingual Decisions

- Persian (default, RTL), English (LTR), Arabic (RTL, structure ready).
- Logical CSS properties for automatic RTL; icon mirroring centralized.
- Vazirmatn (fa/ar) + Inter (en); ~30–40% text expansion budgeted.
- Locale-aware numbers/dates; `hreflang`/canonical per SEO phase.

## Implementation Roadmap

| Phase | Focus | Complexity |
|-------|-------|------------|
| 7B | Wireframes (17 pages) | Low–Medium |
| 7C | Design system + marketing components + Storybook | High |
| 7D | Landing page (13 sections) | High |
| 8 | Business pages + forms + search + legal | High |
| 9 | Dashboard UX (role-aware) | Medium–High |

## Risks

- **Breadth:** 17 pages + ~64 components; mitigated by phased gating.
- **Content dependency:** landing quality needs real seeded content.
- **Motion performance:** guarded by reduced-motion + pointer gates.
- **RTL overflow:** must be checked per page during 7C/7D/8.
- **Environment:** local PostgreSQL role/db still pending (Phase 6.6) — blocks
  end-to-end API testing and photo-ready content.

## Recommendations

1. Proceed to Phase 7B wireframes using the `ux-specification.md` page inventory.
2. Complete Phase 6.6 PostgreSQL setup and the pending `seed_data`/`reset_demo`
   commands so reviewers see real content.
3. In 7C, reuse the existing Phase 5 foundation components before adding the
   ~28 marketing components.

## Verification Results

- **12/12** required docs exist in `docs/design/`.
- **All non-empty** (≥200 chars each; ~7,200 total words).
- **No placeholder markers** (no TODO/TBD/FIXME/lorem/"to be completed").
- **No duplicated section headers** within documents.
- `tsc`, ESLint, and builds are unaffected (no code changed).

## Suggested Git Commit

```
docs(ux): add complete product design & UX architecture (phase 7A)

- 12 design docs: vision, UX spec, sitemap/IA, navigation, motion,
  design language, brand palette, landing spec, component map,
  responsive, multilingual, implementation roadmap
- Update CHANGELOG + NEXT_PHASE for Phase 7B readiness
- Documentation only — no React/CSS/backend changes
```

## Readiness For Phase 7B

**READY.** The UX specification is complete, verified and consistent, and the
build roadmap is defined. Phase 7B (wireframes) can start against the page
inventory in `ux-specification.md`.