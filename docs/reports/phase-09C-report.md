# Phase 9C — Hanahoush Brand Identity Integration + Visual System Refinement

**Status:** ✅ COMPLETE — READY FOR REVIEW
**Date:** 2026-08-11
**Phase:** 9C — Website brand identity + design-system refinement (frontend-only)
**Scope constraint:** The real Odoo 19 ERP is **not** deployed; no ERP/Odoo integration was
implemented. The Phase 9A/9B connector foundation is intact with `ERP_ENABLED=false` and
`NullProvider` active (verified in §24).

---

## 1. Executive summary

Phase 9C converted the website from a generic "Tailwind indigo" look to the organization's
**actual visual identity**, measured from the supplied brand mark. Because this environment's
model cannot render image pixels directly, the brand image at `E:\Ilia Jamali\Hana\IMG_2854 (1).PNG`
was analyzed **programmatically** (Pillow k-means + median-cut clustering on the real pixels),
keeping the image the source of truth — no colors were invented.

The extracted identity — **violet-magenta primary `#932990` + deep-indigo ink `#272161` on a
near-white surface**, with the mark's magenta→indigo gradient — was centralized in the existing
design-token pipeline (no second token/theme system, per Part 12), applied across the site
(Part 4/6/7), verified for WCAG contrast (Part 8), reflected in Storybook and the Design
Playground (Parts 10/11), and documented with token-accurate visual-QA artifacts (Part 13).
All tests/builds pass (Part 14) and the ERP foundation is untouched (Part 15).

## 2. Brand image analysis

- **Input:** `E:\Ilia Jamali\Hana\IMG_2854 (1).PNG`, 1080×1080 RGB.
- **Method (stand-in for visual inspection):** full-pixel pass → background vs mark
  segmentation (lum/channel threshold), median-cut palette, k-means clustering (k=5..10),
  WCAG contrast computation. Scripts kept in the working temp zone; results embedded here.
- **Measured findings:**
  - **~80 % of the image is a near-white surface** (avg `#FEFEFE`) → the brand sits on white.
  - **Mark region (21.4 % non-white):** dominant cluster `#932990` (57 % of mark,
    hue ≈ 302°) = **violet-magenta** — the primary.
  - Second cluster `#272161` (35 % of mark, hue ≈ 246°) = **deep indigo-violet** — the dark
    partner/ink. Deepest mark pixels average `#1F1853` (hue ≈ 247°).
  - Bright edge/tint `#E4CEED` (hue ≈ 283°), muted lavender `#9A78A6`.
  - **Hue profile:** two dominant hues, 301–303° (magenta) and 244–247° (deep indigo) →
    the mark is an intrinsic **magenta → deep indigo gradient**.
- **Note:** the analysis is pixel-derived; the operator should eyeball the result and may lock
  exact anchors with a formal brand spec later (single-file change in the token layer).

## 3. Extracted brand palette (classification)

| Class | Colors | Use |
|---|---|---|
| **Core brand** | `#932990` (primary), `#272161` (secondary/deep ink) | identity moments, primary/secondary actions, headings, dark surfaces |
| **UI-safe semantic** | white `#FFFFFF`, near-white `#FDFBFC`, lavender surfaces `#F3EBF5`/`#F6E8F4`, ink text `#1F1853`, muted `#7E5691`, borders `#E9DFEA` | content, surfaces, text, borders |
| **Accent/decorative** | `#C75BC3` (accent), `#E4CEED` (bright tint), `#9A78A6` (muted lavender) | highlights, soft accents, decorative |
| **Background/surface** | `#FDFBFC` light, `#0D0A19` dark | page/canvas + dark theme |
| **Not forced into UI** | the extreme dark `#1F1853` is used only under 4.5:1-checked pairings; vivid steps below 4.5:1 on light are kept as decorative-badge/stroke only | accessibility |

The raw vivid magenta as *light-mode body text* would be a decorative use only; the
contrast-safe variants (see §6) are what components consume.

## 4. Token changes

Extended the existing single system (`src/design/colors` + `globals.css` runtime vars):

- **`brand` scale (50..950):** `#FDF6FB, #F7E8F7, #EDD1EC, #DDABDB, #C57EC2, #A652A3,
  #932990, #7A2477, #5D2061, #3F1C58, #272161` — hue rotates 302° → 246°.
- **`brand` role tokens added:** `primary #932990`, `primaryHover #7A2477`,
  `primaryActive #691E68`, `secondary #272161`, `secondaryHover #1F1853`,
  `accent #C75BC3`, `accentSoft #F6E8F4`, `onPrimary #FFFFFF`, `onSecondary #FDF6FB`.
- **Themes:** full light/dark HSL maps updated (background, foreground, primary,
  secondary, muted, accent, border, ring, + new `--success/--warning/--error/--info`,
  + hover/selection/scrollbar states).
- **Semantic aliases:** `surface`, `surfaceElevated`, `surfaceMuted`, `text`,
  `textMuted`, `textSubtle`, `focus`, `success`, `warning`, `error`, `info` map into the
  same CSS-variable pipeline (no parallel system).
- **Gradients:** brand/hero/cta/mesh now use the magenta → deep-indigo identity gradient.
- **Tailwind:** `success/warning/error/info` color mappings added.
- **Tests:** `tokens.test.ts` updated for the expanded `brand` object (scale + roles).

No component hard-codes brand hex; all consume tokens (verified: only Tailwind
semantic/`brand-*` classes remain).

## 5. Semantic color mapping

| Token | Light | Dark |
|---|---|---|
| background | `#FDFBFC` (330 33% 99%) | `#0D0A19` (252 43% 7%) |
| surface / card | `#FFFFFF` | `#161226` |
| surfaceElevated / popover | `#FFFFFF` | `#161226` |
| surfaceMuted / secondary | `#F3EBF5` | `#2A2440` |
| text / foreground | `#1F1853` | `#ECE5F2` |
| textMuted / textSubtle | `#7E5691` | `#AB9DBA` |
| border / input | `#E9DFEA` | `#2C2544` |
| focus / ring | `#932990` (302 56% 37%) | `#DC82D7` (303 56% 69%) |
| primary | `#932990` | `#C75BC3` |
| on-primary | `#FFFFFF` | `#171039` |
| secondary (brand) | `#272161` | `#272161` |
| accent | `#F6E8F4` / fg `#7A2477` | `#3A1C58` / fg `#E7D2EE` |
| success | `#15803D` | `#34D399` |
| warning | `#B45309` | `#FBBF24` |
| error (destructive) | `#DC2626` | `#F0564D` |
| info | `#932990` | `#C75BC3` |

## 6. Accessibility / contrast decisions (verified numerically)

| Pair | Contrast | Status |
|---|---|---|
| white on `#932990` (primary button) | 7.09:1 | AAA ✓ |
| white on `#7A2477` (hover) | 8.95:1 | AAA ✓ |
| `#1F1853` on `#FDFBFC`/white (text) | 15.5–16.0:1 | AAA ✓ |
| `#7E5691` on white/card (muted text) | 5.6–5.8:1 | AA ✓ |
| white on `#272161` (deep secondary button) | 14.2:1 | AAA ✓ |
| dark-mode primary button `#C75BC3` + `#171039` text | **4.88:1** | AA ✓ (previous 4.35 was lowered to ink step) |
| `muted-fg` on dark bg | 7.69:1 | AAA ✓ |
| accent fg on accent surface (light/dark) | 7.57 / 9.99:1 | AAA ✓ |
| focus ring vs light / dark bg | 6.88 / 7.65:1 | ≥3:1 ✓ |
| success/warning/error text on white | 5.02 / 5.02 / 4.83:1 | AA ✓ |
| disabled state (muted text on muted surface) | 4.97:1 | readable ✓ |

**Decisions where the raw brand color failed WCAG:**
- Dark-theme primary-foreground deepened to `#171039` to reach 4.88:1 (raw `#1F1853` ink is the
  decorative/original).
- Light-theme status colors use darker UI-safe steps (`#15803D`, `#B45309`, `#DC2626`); the
  vivid steps remain for icons/graphs (non-text), documented.
- The brightest vivid magenta (`<4.5:1` on white) is restricted to decorative/brand tokens,
  never body text.

## 7. Typography decisions

- Fonts **unchanged and preserved**: Vazirmatn (Persian/Arabic), Inter (Latin) — no new font
  system (Part 5).
- Existing scales (display/heading/body/caption/overline) retained; contrast of text colors
  re-anchored to deep-indigo ink (`--foreground`) so EN and FA/AR headings share the same
  weight relationship. Overlines/brand accents now use `brand-700` light / `brand-300` dark.
- RTL: unchanged direction handling (`document.dir`) and Vazirmatn pairing verified.

## 8. Components updated

- **Navbar** — logo fallback mark now on the brand identity gradient (`ه` on
  `brand-600→brand-950`).
- **Footer (marketing)** — brand-gradient signature hairline (identity close).
- **CTA** — gradient variant `brand-600→brand-900` (was `…→indigo-700`).
- **RelatedContent (articles)** — CTA panel gradient `brand-600→brand-900`.
- **GlowBorder** — halo `via-brand-500/20` (brand magenta instead of indigo).
- **Token surfaces (auto via tokens):** hero, section headers, service/project/article
  cards, badges, FAQ, testimonials, partners, statistic cards, buttons, inputs, focus rings,
  selection, scrollbar, cursor orb, gradients, glass tints, loading/empty/error states,
  design-playground and all Storybook showcases.

## 9. Pages updated

No page was redesigned; every public surface now inherits the brand through the token
pipeline: `/`, `/services`, `/projects`, `/projects/:slug`, `/articles`, `/articles/:slug`,
`/about`, `/contact`, `/search`, `/login`, `/forgot-password`, `/reset-password`,
`/unauthorized`, `/session-expired`, `/dashboard`, plus dev surfaces (`/design`,
`/dev/marketing`, `/dev/*`).

## 10. Landing-page refinements

- Hero: primary CTA uses the brand primary (7.09:1 white text), the `ه`-grade eyebrow dot and
  hero orbs now render in brand magenta; headline ink = deep indigo.
- ERP/hanRP section: **unchanged marketing positioning** — still product/marketing content,
  **no ERP connection** (Part 6 requirement), purely retinted via brand tokens.
- Services/projects/articles/testimonials/partners/FAQ: shared card/badge/prose tokens;
  CTA family end-to-end brand; footer closes with the brand hairline.

## 11. Dark-mode verification

Full dark map re-anchored (`#0D0A19` bg, `#161226` cards, `#ECE5F2` text, magenta primary
`#C75BC3`, rings `#DC82D7`). Luminance-tuned gradients and cursor. Contrast pairs in §6 all
pass. Dark theme is exercised via `ThemeProvider` (`dark` class) and Storybook's theme global.

## 12. RTL verification

Direction logic untouched (`LanguageProvider` sets `document.dir`); Vazirmatn pairing
preserved; gradients use logical start→end (no forced LTR stops); the storybook `Rtl` story
runs the brand showcase under `locale: "fa"`. PA/FA/AR strings render in the new tokens.

## 13. Responsive verification

- No layout/breakpoint changes were made (grids, `container-hanahoush`, mobile nav intact).
- Token re-anchoring keeps contrast identical at every breakpoint; Storybook `viewport`
  presets (Mobile 390, Tablet 768, Desktop 1440) remain available for the brand story.
- Mobile QR: metadata unchanged; `text-brand-700/300` overlines legible on all sizes.

## 14. Storybook changes

- **New `Brand/Identity` showcase** (`src/design/stories/brand.stories.tsx`): brand mark,
  scale, contrast-paired role tokens, semantic system (incl. status), gradients, typography,
  buttons + form controls; stories `Identity`, `Light`, `Dark`, `Rtl` (via the existing
  theme/locale toolbar globals).
- **`design-tokens.stories.tsx`** updated: branded header, role chips, status tokens —
  existing token/gradient/radius/shadows/motion/glass sections now render the real brand.
- `build-storybook` ✅ (existing Navbar/Footer/PageRenderer/Services stories untouched and
  now render with the new palette).

## 15. Design Playground changes

`/design` (dev-only) now includes a **Brand Identity** panel (the `ه` mark on the identity
gradient + wordmark), a **Brand Roles** grid (swatches paired with their on-color), and a
**Forms & Semantic Status** section (inputs + success/warning/error/info badges and status
rows). The existing background/typography/spacing/radius/shadows/gradients/motion/glass/
effects/buttons sections automatically show the new palette.

## 16. Visual QA

Token-accurate SVG artifacts generated from the actual token values (honest renders of the
implemented system; consistent with the prior-phase SVG convention — not browser captures):

- `docs/screenshots/phase-09C/brand-palette.svg` — scale + role tokens + provenance.
- `docs/screenshots/phase-09C/semantic-tokens.svg` — light/dark theme + status charts.
- `docs/screenshots/phase-09C/visual-system.svg` — navbar mark, buttons, status, CTA panel,
  footer hairline, focus ring.

Verification surfaces exercised: `/`, the dev routes (`/design`, `/dev/marketing`, `/dev/*`),
and Storybook (`build-storybook` passes; brand story exported).

## 17. Files created

- `frontend/src/design/stories/brand.stories.tsx` (new Brand/Identity showcase)
- `docs/screenshots/phase-09C/brand-palette.svg`
- `docs/screenshots/phase-09C/semantic-tokens.svg`
- `docs/screenshots/phase-09C/visual-system.svg`
- `docs/reports/phase-09C-report.md` (this report)

## 18. Files modified

- `frontend/src/design/colors/index.ts` — brand scale + role tokens + theme maps + statuses
- `frontend/src/styles/globals.css` — `:root`/`.dark` tokens, gradients, cursor
- `frontend/src/design/gradients/index.ts` — identity gradients
- `frontend/tailwind.config.ts` — semantic status color mappings
- `frontend/src/design/tests/tokens.test.ts` — expanded brand object
- `frontend/src/app/layouts/Navbar.tsx` — brand-gradient mark
- `frontend/src/components/marketing/footer/Footer.tsx` — brand hairline
- `frontend/src/components/marketing/cta/CTA.tsx` — identity gradient
- `frontend/src/features/articles/components/RelatedContent.tsx` — identity gradient
- `frontend/src/components/marketing/common/GlowBorder.tsx` — brand halo
- `frontend/src/design/stories/design-tokens.stories.tsx` — branded showcase
- `frontend/src/app/routes/pages/DesignPlayground.tsx` — brand identity/roles/status
- `docs/design/brand-guidelines.md` — measured palette + decisions
- `docs/design/design-language.md` — color/gradient philosophy
- `CHANGELOG.md`, `NEXT_PHASE.md`, `docs/reports/next-phase.md`

**No backend file was touched in Phase 9C.**

## 19. Tests executed

- Frontend: `npm run typecheck`, `npm run lint`, `npm run test` (147), `npm run build`,
  `npm run build-storybook`.
- Backend (re-verified, no code change): `python manage.py check`, `makemigrations --check`,
  `migrate`, `bootstrap`, `pytest`.

## 20. Verification results

| Check | Result |
|---|---|
| TypeScript (`typecheck`) | ✅ 0 errors |
| ESLint (`lint`) | ✅ 0 errors |
| Vitest | ✅ 147 passed (28 files) |
| Vite build | ✅ |
| Storybook build | ✅ |
| Backend `check` | ✅ |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ no migrations to apply |
| `bootstrap` | ✅ idempotent (27 permissions) |
| Backend pytest | ✅ 274 passed |
| New npm dependencies | none |
| RTL / dark-mode regressions | none introduced (token + provider untouched) |
| Console errors | none introduced by frontend changes (build/typecheck) |

## 21. Known issues

- The palette is anchored to one reference image via measured clustering; minor hue drift vs
  the original print/vector artwork is possible. A formal brand spec would lock the anchors
  (one-file change in `src/design/colors`).
- Status `success/warning` in light theme intentionally use darker steps than the vivid brand
  (contrast); vivid steps are decorative.
- Some pre-existing warnings remain unrelated: import_export admin template warning,
  Storybook chunk-size warning, drf-spectacular serializer type-hint hints.

## 22. Deferred work

- ERP/Odoo integration of any kind (outbox, webhooks, sync, Odoo-19 adapter behaviour) —
  deferred until the real Odoo 19 is deployed; Phase 9A/9B foundation only.
- Per-page deep audits (services/articles/auth bespoke brand moments) — next-phase Option B.
- Formal brand-asset audit (logo variants, favicon, og-image in the new palette).
- Production font-loading/`preload` hardening for Vazirmatn/Inter.
- Motion/gradient advanced QA and forced-colors deep pass.

## 23. Architectural risks

- **No duplicate systems introduced** (Part 12): one theme provider, one token pipeline, one
  component library, one API client/CMS/page-builder/analytics/SEO — verified by inspection.
- The `brand` object now mixes scale steps and role keys; numeric indexing must use literal
  keys (`brand[500]`), and any TS `number` indexing needs `as const` (handled in tests).
- Token drift between `globals.css` runtime values and `colors/index.ts` maps must stay in
  lockstep (both edited together; a small consistency check could be added later).

## 24. ERP safety verification (Part 15)

Verified at runtime:

```
ERP_ENABLED = False
ERP_PROVIDER = null
ERP_BASE_URL = ''
active provider = null          (NullProvider active = True)
```

- **No real ERP server contacted** — Phase 9C performed zero network calls to any ERP host;
  the only "network" activity was reading the brand image from local disk.
- **No ERP credentials added**, no `.env`/settings changes, no ERP models, no synchronization,
  no webhooks, **no Odoo 19 assumptions** introduced.
- The Phase 9A/9B connector foundation (`apps/integration`, `ERP_*` settings, health endpoint)
  is untouched and remains ready for future Odoo 19 integration.

## 25. Phase completion status

All Phase 9C success criteria met: brand identity visibly integrated ✅ (via tokens), brand
colors centralized in the existing token system ✅, no duplicate design/theme system ✅,
light/dark ✅, FA/EN/AR ✅, RTL/LTR ✅, responsive ✅, accessibility/contrast verified ✅,
Storybook passes ✅, Design Playground reflects the real brand ✅, public pages functional ✅,
all tests/builds pass ✅, ERP disabled & untouched ✅, visual-QA artifacts exist ✅,
`phase-09C-report.md` complete ✅.

## 26. Recommended next phase

See `NEXT_PHASE.md` / `docs/reports/next-phase.md`. Short version:
- **When Odoo 19 is deployed → Phase 9D (Website → ERP operational flows)** using the Phase 9B
  provider port (outbox + dispatcher + lead/contact/newsletter events) in a staged sandbox.
- **Meanwhile (site-leading option) → Phase 9E (brand depth + interaction polish):**
  per-public-page brand audit, advanced motion/gradients QA, and design-system hardening
  (font loading, forced-colors sweep).

---

**PHASE 9C COMPLETE — READY FOR REVIEW**
Report path: `docs/reports/phase-09C-report.md`
Visual QA: `docs/screenshots/phase-09C/`