# Phase 9F — Immersive Brand Identity & Living Visual System

**Status:** ✅ COMPLETE — READY FOR REVIEW
**Date:** 2026-08-18
**Phase:** 9F — brand identity adoption (real logo), living grid, scroll visual states,
Living Cursor elevation, system-cursor policy, video decision, visual QA.
**Scope constraint honoured:** no ERP/Odoo/hanRP operational work. `ERP_ENABLED=false`,
`ERP_PROVIDER=null`, `NullProvider` active, no credentials, no ERP network calls. The
Phase 9A/9B connector foundation is untouched (§19). No second visual/theme/motion/token
system was created — every new surface consumes the existing design tokens (§5) and the
existing Page Builder (§7).

---

## 1. Executive summary

Phase 9F is an **audit-first, token-driven** elevation of the Hanahoush visual layer:

- **Real logo (Part A)** — The organizational brand mark
  (`E:\Ilia Jamali\Hana\IMG_2854 (1).PNG`) was analyzed programmatically (dimensions,
  background, safe visible area, padding, interior design holes) and adopted as the
  primary site logo. Processed, **not redrawn**: the icon lockup and full lockup are
  served from `frontend/public/brand/` and rendered through a shared `BrandLogo`
  component in the Navbar (desktop + mobile header/drawer), Footer, AuthShell, Design
  Playground and the brand/design-token Storybook showcases. Favicon + apple-touch-icon
  + manifest icons were generated with the suitability caveat documented. The gradient
  "ه" placeholder is gone from all primary-brand locations.
- **Living grid (Part B)** — `SiteBackground` now composes the existing primitives with a
  section-aware **grid energy** bloom and a **transform-only rAF engine** (subtle scroll
  parallax ±60px, pointer nudge ±7/5px) that stops at idle and is gated to fine-pointer,
  non-reduced-motion, non-low-concurrency devices. No canvas was added (CSS/SVG was
  sufficient — documented in §11/§12).
- **Scroll visual states (Part C)** — A reusable, token-driven mechanism:
  `PageRenderer` annotates every section slot with `data-visual-state`, a single
  `VisualStateProvider` observes those sections and publishes `--vs-*` CSS variables on
  `<html>`, and the background interpolates between token-defined states
  (hero → services → erp → projects → articles → cta) with 700ms CSS transitions. No
  per-component page hacks.
- **Living Cursor as primary pointer experience (Part D)** — The existing cursor now
  morphs per element state (link/button/card/draggable/text/disabled) and the system
  cursor is suppressed **only** on fine-pointer desktops via `html.hh-live-cursor` +
  CSS, with text-entry surfaces always retaining a native I-beam. Touch, coarse pointers
  and reduced-motion users are fully unaffected.
- **Palette verification (Part E)** — Re-measured the actual logo (k-means): magenta
  cluster `#90298E` vs token `#932990`, indigo `#272260` vs ink `#272161`. The existing
  9C palette is accurate — **zero token changes** were required.
- **Video (Part F)** — The CSS/SVG/token prototype already delivers the premium effect;
  video is deferred with a full asset specification in §12.
- **Verification (Part K/L)** — Frontend typecheck/lint/test/build/build-storybook and
  backend check/makemigrations/migrate/bootstrap/pytest all executed and green; ERP
  runtime safety re-verified; production bundle clean of dev-only artifacts; logo asset
  referenced; cursor suppression scope confirmed.

## 2. Initial audit findings

The audit (partially hands-on, per the 9A–9E report trail) found:

- The 9C palette was pixel-measured but the **actual logo image was never adopted** —
  the site still used a gradient "ه" placeholder in the Navbar fallback, AuthShell,
  Design Playground and the brand Storybook showcase. The CMS logo override path
  existed but the seed ships no logo, so the placeholder was the visible mark.
- The grid background (`AnimatedGrid`/`.hh-grid`) was a strong static/callback CSS
  layer but had **no scroll/pointer/section reactivity** and no section-aware energy.
- The Living Cursor already had the required orb/glow/ring + rAF interpolation +
  theme/touch/reduced-motion/perf gates, but was **not** state-aware and did not
  suppress the competing system cursor.
- Existing infrastructure was ripe for reuse: one token pipeline
  (`src/design/colors` + `globals.css`), one Page Builder (`PageRenderer`,
  `SectionSlot`, section registry with typed section types), IntersectionObserver
  utilities and `useSectionVisibility`, framer-motion `MotionConfig reducedMotion`,
  and the `useCursorEnabled` gate.

No ERP artifacts, no second theme/motion/token system, and no heavy scroll library were
introduced.

## 3. Real logo source and analysis

| Property | Result |
|---|---|
| Source | `E:\Ilia Jamali\Hana\IMG_2854 (1).PNG` (file container reports `JPEG`, 39,504 bytes) |
| Dimensions | 1080×1080 RGB (no alpha) |
| Background | pure white (corners `rgb(255,255,255)`), **~81% of canvas is near-white** |
| Mark structure | icon lockup (bounded `x[145…1031] y[166…613]`, 887×448, aspect ≈ 1.97) above a Persian wordmark (`x[50…1013] y[668…943]`) — a vertical logo lockup on white |
| Padding | left 4.6% · right 4.4% · top 15.4% · bottom 12.6% |
| Interior design holes | **~0.9% of the white is enclosed by the mark** → background removal must be border-connected (flood-fill), not global white→transparent |
| Dominant colors (k-means) | `#90298E` (magenta), `#272260` (deep indigo), `#DBC9E5` (lavender tint) |
| Display decision | crop icon lockup for compact UI slots; keep full lockup for large brand moments; remove background via border-connected flood-fill + feather; **never redraw/recolor** |

The white-point `#FDFBFC` surface token and the measured marks `#932990` / `#272161`
are within measurement tolerance of the clusters above (§5).

## 4. Logo implementation

- **Asset location (existing convention):** static assets live in `frontend/public/`
  (Vite serves them as-is); the brand set went to `frontend/public/brand/`:
  - `hanahoush-logo.png` — icon-only mark, transparent, 512×271 (~65 KB)
  - `hanahoush-logo-full.png` — full lockup, transparent, 512×512 (~102 KB)
  - `icon-192.png` / `icon-512.png` — PWA manifest icons (white bg, faithful to source)
  - `favicon.png` (32×32) + `apple-touch-icon.png` (180×180) at `public/` root
- **Constants:** `src/config/brand.ts` (`brandAsset` paths + variant type).
- **Component:** `src/components/brand/BrandLogo.tsx` (variants `mark`/`full`, localized
  `alt`, `object-contain`, eager/lazy, className passthrough). Tested.
- **Replaced marks:**
  - `Navbar.tsx` — desktop + mobile header/drawer: CMS logo override still wins; the
    fallback is now the real mark (`h-8 w-auto`) instead of the gradient "ه".
  - `AuthShell.tsx` — `h-9 w-auto` mark + localized wordmark.
  - `EnterpriseFooter` and the loading-bar footer — mark beside the company/copyright.
  - `DesignPlayground.tsx` brand panel — real mark on the identity gradient.
  - `design/stories/brand.stories.tsx` + `design-tokens.stories.tsx` — real mark.
  - `index.html` — `apple-touch-icon` link added; `manifest.webmanifest` — icons,
    `theme_color #932990`, `background_color #ffffff`.
- **Favicon/app-icon suitability:** the source is **technically usable** (high
  resolution, high-contrast mark) but is a **wide** lockup (≈1.97:1), so at 16/32px the
  mark is small on a favicon canvas. We generated a clean 32×32 and documented that a
  dedicated square glyph/monogram would be the ideal long-term app icon (deferred —
  §21). The mark is displayed as-is in every UI slot; light/dark, RTL/LTR and
  responsive sizing are preserved; no layout shift (fixed `h-* w-auto` container
  heights matching the prior marks).

## 5. Existing design-token integration

- Re-measured the logo (k-means, k=3) and compared with the 9C palette:
  `#90298E` (#932990), `#272260` (#272161), lavender `#DBC9E5` (9C accent step) —
  **the existing palette stands; no token changes were made**.
- New visuals consume the existing pipeline: grid energy and cursor glow use
  `hsl(var(--ring) …)` (theme-aware light `#932990` / dark `#DC82D7`); grid lines use
  `--border`; the mesh uses `--gradient-mesh`; CTA/focus/interactive states untouched.
- Visual-state variables (`--vs-*`) are published by the provider and consumed with
  fallbacks (`var(--vs-grid-size, 48px)`), so the background degrades gracefully when
  the provider is absent.
- Chain visualised: **real logo → color tokens → grid → living cursor → motion**.

## 6. Grid/background architecture

`src/design/background/index.tsx` (+ `globals.css`):

- `.hh-backdrop` — fixed, **oversized** (`inset:-64px`) canvas so the parallax never
  exposes an edge; `z-index:-10`; `pointer-events:none`.
- `AnimatedGrid` — masking root + `.hh-grid-scale` canvas (oversized 120%, CSS pan
  `hh-grid-pan` 24s linear, `background-size: var(--vs-grid-size,48px)`, morph
  `transform: scale(var(--vs-grid-scale,1))`).
- `GridEnergy` — section-aware radial bloom positioned/sized by `--vs-energy-*`, opacity
  `--vs-energy-opacity`, radial uses `hsl(var(--ring) / 0.4)` (brand/violet-magenta).
- `GradientMesh` — existing CSS mesh, opacity now `--vs-mesh-opacity`.
- `Particles` / `NoiseLayer` — unchanged Phase 7B primitives (reused, not duplicated).
- `useLivingGridMovement` — transform-only engine: scroll parallax
  (`scrollY * 0.05`, clamped ±60px) + pointer nudge (±7px/±5px), rAF-driven, **stops
  when settled** (no idle loop), pauses while the tab is hidden, resets transforms on
  cleanup. Gated by `useCursorEnabled()` (fine pointer + no reduced motion +
  concurrency ≥ 4). Touch/mobile therefore gets the static visual concept only.

No canvas was introduced; CSS gradients/transforms were sufficient (§12).

## 7. Scroll visual-state architecture

- **Tokens:** `src/design/visual-states/index.ts` — `visualStateTokens` per state
  (`gridSize`, `gridScale`, `energyOpacity`, `energySize`, `energyX/Y`, `meshOpacity`),
  `visualStateVars` (the `--vs-*` names), and `visualStateForSectionType` (section-type
  → state mapping; unknown/neutral → `default`).
- **Story mapping:** `hero` (strongest) · `services` (settles, cards meet glow) · `erp`
  (denser cells, data-oriented) · `projects` (larger cells, spatial/editorial) ·
  `articles` (calm) · `cta` (strongest energy return).
- **Renderer integration:** `PageRenderer.SectionSlot` adds
  `data-visual-state={visualStateForSectionType(section.type)}` to every section
  wrapper — one central change, no component hacks.
- **Provider:** `src/design/visual-states/VisualStateProvider.tsx` — IntersectionObserver
  (thresholds 0/0.15/0.4/0.7, rootMargin bottom −10%) over `[data-visual-state]`,
  MutationObserver reconciliation for lazily-loaded sections; picks the highest-visibility
  intersecting section (ties → lower on page); publishes CSS variables on
  `document.documentElement`; context `useVisualState()` exposed; children memoized to
  avoid whole-app re-renders. Mounted once in `AppProviders`.
- **Transition:** the background CSS transitions the consuming properties over 700ms —
  under `prefers-reduced-motion` all durations are zeroed, so states still switch
  without motion (§10).

## 8. Living Cursor changes

`src/design/cursor/index.ts` + `HanahoushCursor.tsx` (+ CSS):

- New `CursorState` = `default | link | button | card | draggable | text | disabled`
  with `cursorStateTokens` (ring/orb scale, ring opacity, dashed variant).
- Pure, exported **`classifyCursorState(target)`** (unit-tested): text-entry
  (`input/textarea/select/contenteditable`) → `text`; buttons/roles/summary →
  `button` (disabled/aria-disabled → `disabled`); links → `link`; `[draggable=true]` →
  `draggable`; `[data-cursor="card"]`/`article`/`[class~="bg-card"]` → `card`.
- The container gets `data-state`; position lerp now writes the CSS **`translate`**
  property while **`transform: scale`** (from state CSS) composes on top — no jitter.
- `Card` (`ui/card.tsx`) carries an explicit `data-cursor="card"` hook.
- The component toggles `html.hh-live-cursor` while enabled (and removes it on
  disable/unmount).
- Everything else preserved: `pointer-events:none`, `aria-hidden`, rAF interpolation,
  theme-aware ring via `--ring`, touch/low-perf/reduced-motion disabling.

## 9. System cursor suppression rules

`globals.css`:

```css
@media (pointer: fine) and (prefers-reduced-motion: no-preference) {
  html.hh-live-cursor, html.hh-live-cursor * { cursor: none !important; }
  html.hh-live-cursor input, html.hh-live-cursor textarea,
  html.hh-live-cursor select, html.hh-live-cursor [contenteditable="true"],
  html.hh-live-cursor [contenteditable="plaintext-only"] { cursor: auto !important; }
}
```

- **Suppressed only** on fine-pointer desktops with motion allowed, and only while the
  living cursor is actually enabled (`hh-live-cursor` present).
- **Never suppressed** on touch/coarse pointers, under reduced motion (cursor disabled
  → class absent), or over text-entry surfaces (native I-beam retained).
- The visual layer is `pointer-events:none` so it never blocks interaction; keyboard
  navigation and focus states are CSS/JS-untouched.

## 10. Accessibility verification

- `prefers-reduced-motion`: global zeroing unaffected; living cursor disabled (native
  cursor visible); grid dimmed to 0.5; visual states still switch (no motion conveys
  information). Verified via `useCursorEnabled` gates + CSS (`visual-states.test.ts`
  asserts the story direction, not motion).
- Keyboard: suppression is CSS-only and class-gated; no JS blocks keys; focus rings
  (`:focus-visible`) untouched.
- Screen readers: all new layers are `aria-hidden`; the logo alt text is localized
  (`t("app.title")` / `company.name`); `BrandLogo` is a plain `img` with a real alt.
- Light/dark + RTL/LTR: logo renders as-is with transparent background; CSS uses
  logical layout; wordmark text remains localized.
- Text selection & forms: `text` cursor state keeps the I-beam; no pointer-event blocks.
- No important information depends on motion.

## 11. Performance verification

Baseline and after (all executed):

- `typecheck` 0 errors · `lint` 0 errors · `test` **168 passed (31 files)** ·
  `build` ✅ (7.3s) · `build-storybook` ✅.
- Production bundle dev-artifact scan: **clean** (no `/dev/*`, `/design`,
  `DesignPlayground`, `MarketingPreview` strings in `dist/assets`).
- Asset inclusion: `dist/brand/*` + `favicon.png` + `apple-touch-icon.png` present;
  total brand payload ≈ 65 + 102 + 13 + 58 + 2 + 15 ≈ 255 KB static (retina 512px
  versions; no runtime JS for images).
- No new npm dependencies; no new pip dependencies.
- Layout thrash: only transform/opacity/CSS-variable transitions; the only
  layout-adjacent writes (`left/top/width/height` on the energy layer) occur at rare
  **visual-state changes**, not per frame.
- No continuous expensive loop: the living-grid engine cancels its rAF when values
  settle; particles use one canvas with capped DPR/count and are gated on fine pointers.
- **Why no canvas:** grid/mesh/energy are pure CSS gradients + transforms; particles
  already use a capped canvas only where effects demand it. Documented in §12.

## 12. Video decision

**Decision: no background video.** The CSS/SVG/token prototype already delivers the
desired premium effect (§6/§7) — subtle parallax, section-aware energy, calm/strong
story — at ~zero runtime cost. Evaluation:

- Would a video materially improve it? **Marginal** for a background whose role is
  atmosphere; the token motion reads as intentional without footage.
- Performance? A full-bleed background video would cost bandwidth, decode and battery;
  the CSS system is nearly free.
- Necessary on mobile? **No** — mobile already gets the reduced static concept.
- Short loop / poster / fallback? Documented below for a genuine future need.

### VIDEO ASSET SPECIFICATION — OPTIONAL FUTURE ENHANCEMENT

- **Visual concept:** an ultra-slow, abstract loop of the brand magenta→deep-indigo
  gradient breathing through the grid — approximately a 110–180 s seamless ambient loop,
  no cuts, no product shots, 2–5% opacity treated like the current mesh, always under
  the existing `--vs-*` state logic.
- **Technical requirements (if it becomes justified):**
  - Duration: 12–20 s seamless loop (WebM), ideally 20 s;
  - Resolution: 1280×720 (lo-fi is fine for a background) with a 4K master (3840×2160);
  - Aspect ratio: 16:9, letterboxed to viewport via `object-fit: cover`;
  - FPS: 30;
  - Alpha/transparency: none needed (full-frame gradient);
  - Loop behavior: seamless (motion paths must loop cleanly);
  - Compression target: total < 3 MB WebM (target ≤ 1.5 MB/s) + H.264 MP4 fallback;
  - Mobile fallback: `prefers-reduced-motion: reduce` and coarse pointers → no video
    (static poster frame), and smaller files via `media`/sources;
  - Poster frame: a token-accurate still derived from the CTA visual state;
  - Autoplay muted + `playsinline`, `preload="none"`/`metadata`, IntersectionObserver
    + Intersection pause, `aria-hidden`.
- **Not created in this phase** — no stock footage, no invented assets.

## 13. Visual QA

Token-accurate mockups (clearly labelled **NOT browser screenshots**; a browser harness
is unavailable here) in `docs/screenshots/phase-09F/`:

1. `logo-integration.svg` — Navbar light/dark, footer light/dark, AuthShell with the
   real mark (embedded).
2. `light-theme-grid.svg` — light grid + energy (`#FDFBFC`, `#932990` glow, 48px).
3. `dark-theme-grid.svg` — dark grid + energy (`#0D0A19`, `#DC82D7` glow).
4. `scroll-states.svg` — the six visual states with grid sizes/energy positions/
   opacities + `data-visual-state` labels.
5. `cursor-states.svg` — default/link/button/card/draggable/text/disabled visuals.
6. `mobile-fallback.svg` — touch fallback (static concept, no particles/parallax/
   cursor).
7. `reduced-motion-fallback.svg` — reduced-motion fallback (static, native cursor).

## 14. Files created

Frontend:
- `src/components/brand/BrandLogo.tsx` (+ `BrandLogo.test.tsx`)
- `src/config/brand.ts`
- `src/design/visual-states/index.ts`
- `src/design/visual-states/VisualStateProvider.tsx`
- `src/design/tests/visual-states.test.ts`
- `public/brand/hanahoush-logo.png`, `hanahoush-logo-full.png`, `icon-192.png`,
  `icon-512.png`
- `public/favicon.png`, `public/apple-touch-icon.png`
- `docs/screenshots/phase-09F/*.svg` (7 artifacts)
- `docs/reports/phase-09F-report.md` (this report)

## 15. Files modified

Frontend:
- `src/config/` — (new `brand.ts`, above)
- `src/design/background/index.tsx` — living grid (grid scale, energy, parallax,
  `hh-backdrop`)
- `src/styles/globals.css` — grid structure, backdrop, energy, mesh opacity, cursor
  states + suppression, reduced-motion additions
- `src/design/cursor/index.ts` — cursor state tokens + `classifyCursorState`
- `src/design/cursor/HanahoushCursor.tsx` — state engine, `translate`-based lerp,
  `hh-live-cursor` toggle
- `src/design/index.ts` — exports `visual-states`, `GridEnergy`
- `src/app/providers/AppProviders.tsx` — mount `VisualStateProvider`
- `src/features/page-builder/renderer/index.tsx` — `data-visual-state` annotation
- `src/app/layouts/Navbar.tsx` — real logo fallback (desktop/mobile/drawer)
- `src/app/layouts/Footer.tsx` — logo in loading-bar footer
- `src/components/marketing/footer/Footer.tsx` — logo in company block
- `src/features/auth/pages/AuthShell.tsx` — logo mark
- `src/app/routes/pages/DesignPlayground.tsx` — logo panel
- `src/design/stories/brand.stories.tsx`, `design-tokens.stories.tsx` — real mark
- `src/components/ui/card.tsx` — `data-cursor="card"`
- `src/features/page-builder/tests/renderer.test.tsx` — visual-state annotation test
- `index.html` — apple-touch-icon link
- `public/manifest.webmanifest` — icons/theme colors
- `CHANGELOG.md`, `NEXT_PHASE.md`, `docs/reports/next-phase.md`

Backend: **no application files modified.**

## 16. Tests added/updated

- `src/design/tests/visual-states.test.ts` (new): visual-state tokens for every state,
  section-type mapping, scroll-story direction, CSS variable names, and
  `classifyCursorState` coverage (text/input, links, buttons, disabled/aria-disabled,
  cards via `data-cursor` and `bg-card`, draggable, defaults, precedence).
- `src/components/brand/BrandLogo.test.tsx` (new): mark/full variants, alt, sizing
  classes, eager loading.
- `src/features/page-builder/tests/renderer.test.tsx` (updated): asserts
  `data-visual-state` is set per section type (services → `services`, neutral → `default`)
  and added a neutral `faq` section fixture.

Frontend total: **168 passed (31 files)**.

## 17. Full verification results

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 168 passed (31 files) |
| `npm run build` | ✅ |
| `npm run build-storybook` | ✅ |
| `python manage.py check` | ✅ (pre-existing import_export warning only) |
| `makemigrations --check` | ✅ No changes detected |
| `migrate` | ✅ No migrations to apply |
| `bootstrap` | ✅ idempotent (permissions 27, roles 6, users 6, demo content) |
| `pytest` (`USE_SQLITE=true`) | ✅ 274 passed |
| Production bundle dev-artifact scan | ✅ clean (`DesignPlayground`, `/dev`, `/design`, `MarketingPreview` absent) |
| Brand assets in `dist/` | ✅ `brand/*`, `favicon.png`, `apple-touch-icon.png`, manifest |
| Logo referenced | ✅ `BrandLogo` → `/brand/hanahoush-logo.png` (+ full variant) |
| Cursor suppression scope | ✅ `(pointer:fine)` AND `prefers-reduced-motion:no-preference`, gated by `html.hh-live-cursor`; text-entry override `cursor:auto` |
| Touch / reduced-motion fallbacks | ✅ gated by `useCursorEnabled` (fine pointer + no reduction + concurrency) |

## 18. Regression verification

Public surfaces reviewed against the changed subsystems — nothing else was touched:

- `/` — PageBuilder sections render with new `data-visual-state`; living background
  behind them; hero/CTA/statistics unchanged in markup.
- `/services`, `/projects`, `/projects/:slug`, `/articles`, `/articles/:slug`,
  `/about`, `/contact`, `/search` — unchanged rendering; background states default or
  mapped per section type; CMS/cards unchanged.
- auth pages + auth shell + `/dashboard` — logo swapped; flow untouched.
- Page Builder / CMS / analytics / localization / dark mode / RTL-LTR / SEO — no logic
  touched; `data-visual-state` is a purely additive attribute. `index.html` head loses
  nothing (only one icon link added).
- Tests confirm the renderer still dedupes, disables, shows unknown fallbacks and empty
  states (§16). ERP remains dormant (§19).

## 19. ERP safety verification

Runtime (`python manage.py shell` + source):

```
ERP_ENABLED      = False
ERP_PROVIDER     = null
ERP_BASE_URL     = ''
ERP_API_KEY set  = False
config problems  = []
active provider  = NullProvider
```

- No real ERP server contacted; no Odoo models, migrations, sync flows, credentials,
  endpoints, webhooks or Odoo-19 assumptions added.
- `apps/integration` and the `ERP_*` settings were **not modified**; the 9A/9B
  connector foundation is untouched.
- Backend tests (including ERP provider/status tests) pass under the documented
  `USE_SQLITE=true` fallback.

## 20. Known issues

- **Browser harness unavailable** — motion smoothness, parallax displacement, cursor
  state rendering and pixel-level responsive checks are code/token-verified, not
  browser-verified.
- **Favicon of a wide mark** — the mark is legible at 32px but small; a dedicated
  square glyph would be ideal (deferred).
- **Visual-state intensities are defaults** — measured/literature defaults; real-browser
  tuning may refine `--vs-*` values (single-file token change).
- **`VisualStateProvider` re-renders scoped to its context consumers** — children are
  memoized; only `useVisualState()` consumers re-render on section changes (none today).
- Pre-existing: import_export admin template warning, Storybook chunk-size warning,
  local PostgreSQL test-DB limitation (SQLite fallback), SPA SEO ceiling.

## 21. Deferred work

- ERP/Odoo operational integration of any kind — until the real Odoo 19 is deployed.
- Browser-based verification harness (Playwright-style): verify/correct living-background
  parallax, energy transitions and cursor suppression in a real browser; Storybook
  viewport sweeps.
- Dedicated **square logo glyph** for favicon/app-icon marks.
- Optional live-browser tuning of visual-state energies/parallax.
- Centralise i18n + backend-seed copy (pre-existing 9E/next-phase item).
- Background **video** — only if the §12 specification is genuinely requested.

## 22. Architectural risks

- **One system discipline** maintained: no second background engine, cursor, token set
  or motion library. The visual-state mechanism lives in `design/` and relies only on
  CSS variables + IntersectionObserver.
- `--vs-*` values live in TS tokens and are applied by the provider; **CSS fallbacks**
  keep the background safe if the provider ever unmounts.
- The `translate` + `transform` split for the cursor is a deliberate CSS-composition
  technique; only browsers without `translate` support fall back to unscaled morphing
  (positioning still works via the fallback-less `translate` in this codebase's scope).
- Token/globals lockstep risk unchanged from previous phases (both are edited together).

## 23. Documentation

- `docs/reports/phase-09F-report.md` (this file)
- `docs/screenshots/phase-09F/*` — 7 token-accurate QA mockups
- `CHANGELOG.md` — Phase 9F entry
- `NEXT_PHASE.md`, `docs/reports/next-phase.md` — status + next-phase prep
- `src/config/brand.ts` — provenance + asset notes
- `src/design/visual-states/index.ts` — mechanism documentation
- `src/design/cursor/index.ts` — cursor-state contract documentation

## 24. Final status

All Phase 9F parts are implemented and verified: real logo adopted (Part A), living grid
(Part B), scroll visual states (Part C), Living Cursor as primary pointer experience
with scoped system-cursor suppression (Part D), logo/color integration with zero palette
changes (Part E), video decision documented (Part F), accessibility (Part G) and
performance (Part H) verified, visual QA artifacts delivered (Part I), no regressions
(Part J), full verification executed (Part K), and this report complete (Part L).

**PHASE 9F COMPLETE — READY FOR REVIEW**
Report path: `docs/reports/phase-09F-report.md`
Visual QA: `docs/screenshots/phase-09F/`