# Hanahoush — Phase 5 Report: React Foundation & Design System

> Enterprise frontend foundation: providers, theming, RTL/LTR, design tokens,
> layouts, UI components, hooks, Axios wiring, routing and Storybook.
> Date: 2025-08-04

---

## 1. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Provider composition root** (`AppProviders`) | One place to compose Theme → Language → Query → Axios → Toast → ErrorBoundary; the router sits inside so every route inherits all contexts. See `docs/adr/ADR-0003`. |
| **CSS-variable theming** (light/dark/system) | Semantic tokens as CSS variables + `data-theme`; components only use semantic utilities, so theming needs no component changes. |
| **RTL/LTR via `document.dir`** | Language is the single source of truth; direction derives from it. Components use logical CSS utilities (`ms-*`, `start-*`). See `docs/adr/ADR-0004`. |
| **Design tokens in TS + CSS + Tailwind** | Single source of truth mirrored across TypeScript (`src/design/tokens`), CSS variables and Tailwind config. Brand palette is indigo. |
| **Spacing NOT overridden in Tailwind** | The token scale matches Tailwind's built-in spacing; overriding `theme.spacing` with a static object triggers a Tailwind 3.4 circular-reference crash (ADR-0002). |
| **shadcn-style components** | Radix primitives + `class-variance-authority` + `cn()`, co-located stories. Enterprise-standard, accessible, themeable. |
| **Axios auth structure only** | Interceptors + token storage + refresh structure exist; no login flows. Authentication lands in a later phase. |
| **Vendor chunk splitting** | `vite.config.ts` manualChunks (react, query, motion) keeps the main bundle small. |
| **Storybook 8 (stable line)** | Storybook 10 reorganised addons; 8.6 is the battle-tested line that pairs with `@storybook/addon-essentials`. |

---

## 2. Application Providers

```
ErrorBoundary
  └─ ThemeProvider
      └─ LanguageProvider
          └─ QueryProvider
              └─ AxiosProvider
                  └─ ToastProvider
                      └─ RouterProvider (inside AppRouter)
```

| Provider | Module | Responsibility |
|----------|--------|----------------|
| `ThemeProvider` | `src/app/theme/` | light/dark/system + `data-theme` + system listener + localStorage |
| `LanguageProvider` | `src/app/language/` | fa/en/ar + `document.dir`/`lang` switching + i18next sync |
| `QueryProvider` | `src/shared/api/` | @tanstack/react-query client |
| `AxiosProvider` | `src/shared/api/` | axios instance + global `isLoading` / `error` state |
| `ToastProvider` | `src/components/ui/toast` | Framer Motion toasts (`useToast`) |
| `ErrorBoundary` | `src/app/providers/` | render-error fallback with retry |

---

## 3. Theme System

- **Modes:** light, dark, system.
- **Mechanism:** toggles `dark` class + `data-theme` + `color-scheme` on `<html>`.
- **System tracking:** `matchMedia("(prefers-color-scheme: dark)")` listener active in system mode.
- **Persistence:** `localStorage["hanahoush-theme"]`.
- **Fonts:** Vazirmatn Variable (Persian/Arabic), Inter Variable (Latin) via `@fontsource-variable/*`.

---

## 4. RTL / LTR Switching

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| Persian | `fa` | RTL | Full |
| English | `en` | LTR | Full |
| Arabic | `ar` | RTL | Structure only (falls back to EN) |

`LanguageProvider` sets `document.documentElement.dir` + `lang`; all layouts use
Tailwind logical utilities so they flip automatically. Preference persisted in
`localStorage["hanahoush-language"]`.

---

## 5. Design Tokens

| Token group | Module | Notes |
|-------------|--------|-------|
| Colors | `colors.ts` | Brand indigo scale (50–950) + semantic colors via `hsl(var(--…))` |
| Typography | `typography.ts` | Font families, size scale, line heights, weights, letter-spacing |
| Spacing | `spacing.ts` | 4px scale (docs; matches Tailwind built-ins) |
| Radius | `radius.ts` | Derived from `--radius` |
| Shadow | `shadow.ts` | Elevation scale |
| Animation | `animation.ts` | Durations, easing, Framer Motion defaults |

CSS variables live in `src/styles/globals.css`; Tailwind maps them in
`tailwind.config.ts`. Brand default color is **indigo** (`#6366f1` @ 500).

---

## 6. Reusable Layouts

| Component | Location |
|-----------|----------|
| `AppLayout` | `src/app/layouts/AppLayout.tsx` — Navbar + main + Footer |
| `Container` | `src/components/layout/container.tsx` |
| `Section` | `src/components/layout/section.tsx` |
| `Navbar` | `src/app/layouts/Navbar.tsx` — responsive, theme/language toggles |
| `Footer` | `src/app/layouts/Footer.tsx` |
| `PageWrapper` | `src/app/layouts/PageWrapper.tsx` — breadcrumb + title + content |

---

## 7. UI Components (25)

**Form:** Button, Input, Textarea, Label, Select, Checkbox, RadioGroup, Switch
**Feedback:** Alert, Toast, Spinner, Loading, Skeleton, EmptyState, ErrorState
**Display:** Badge, Avatar, Card, Breadcrumb, Pagination, Tabs, Accordion
**Overlays:** Dialog, Modal
**Page/App:** SectionTitle, HeroContainer, Grid, ThemeToggle, LanguageToggle

All are TypeScript-strict, RTL-safe, `cn()`-composed, and ship a `.stories.tsx`.

---

## 8. Hooks

| Hook | File |
|------|------|
| `useTheme` | `src/app/theme/useTheme.ts` |
| `useLanguage` | `src/app/language/useLanguage.ts` |
| `useAxios` | `src/shared/api/AxiosProvider.tsx` |
| `useApi` | `src/shared/api/useApi.ts` |
| `useDebounce` | `src/shared/hooks/useDebounce.ts` |
| `useLocalStorage` | `src/shared/hooks/useLocalStorage.ts` |
| `useWindowSize` | `src/shared/hooks/useWindowSize.ts` |

---

## 9. Axios Foundation

- **Request interceptor** — attaches `Authorization: Bearer <token>` (structure only).
- **Response interceptor** — error normalization to `ApiError`, global loading bus, transparent 401 refresh **structure** (no real token exchange).
- **`tokenStorage`** — persist/read access+refresh tokens.
- **`apiRequest<T>`** — typed helper against the backend `{success, message, data, errors}` envelope.

---

## 10. Routing

Empty routes configured: `/`, `/services`, `/projects`, `/articles`, `/about`,
`/login`, `/dashboard`, `*` (404). Non-home routes render a generic
`PlaceholderPage` (under construction) — **no business pages**.

Temporary homepage shows: Hanahoush, Enterprise Platform, React Foundation
Ready, theme switch, language switch, sample buttons, cards, typography.

---

## 11. Storybook

- `.storybook/main.ts` (stories glob, react-vite framework, autodocs)
- `.storybook/preview.tsx` (providers decorators + theme/locale toolbar globals)
- Stories: Button, Input, Card, Badge, Alert, Form Controls, Data Display,
  Design System/Tokens
- `npm run storybook` (dev), `npm run build-storybook` (static build → `storybook-static/`)

---

## 12. Files Created / Modified

**Created:**
- `src/design/tokens/{colors,typography,spacing,radius,shadow,animation,index}.ts` + `tokens.stories.tsx`
- `src/app/language/{language.types,LanguageProvider,useLanguage}.ts(x)`
- `src/app/providers/{ErrorBoundary.tsx}` (AppProviders updated)
- `src/components/ui/*.tsx` (25 components) + `index.ts` + stories
- `src/components/layout/{container,section,index}.tsx`
- `src/app/layouts/{AppLayout,Navbar,Footer,PageWrapper}.tsx`
- `src/app/routes/pages/{HomePage,PlaceholderPage,NotFoundPage}.tsx`
- `src/shared/api/{AxiosProvider,useApi,tokenStorage}.ts(x)`; `src/shared/types/api.ts`
- `src/shared/hooks/{useDebounce,useLocalStorage,useWindowSize}.ts`
- `.storybook/{main.ts,preview.tsx}`
- `docs/{README,architecture,frontend,components,adr}/*.md`

**Modified:**
- `src/main.tsx` (fonts import)
- `src/app/providers/AppProviders.tsx` (full composition)
- `src/styles/globals.css` (token variables + RTL fonts)
- `tailwind.config.ts` (token mapping + keyframes)
- `vite.config.ts` (manualChunks)
- `eslint.config.mjs` (ignore storybook-static)
- `tsconfig.json` (include .storybook)
- `src/i18n/*` + locale files (added ar)
- `package.json` (new deps + storybook scripts)

---

## 13. Verification

| Check | Command | Result |
|-------|---------|--------|
| TypeScript (strict) | `tsc --noEmit` | ✅ OK (incl. `.storybook`) |
| ESLint (flat config) | `eslint .` | ✅ no errors |
| Unit tests | `vitest run` | ✅ passing |
| Production build | `vite build` | ✅ OK, chunk-split |
| Storybook build | `build-storybook` | ✅ OK |

---

## 14. Future Improvements

1. **Feature slices** — add `src/features/{articles,projects,…}` with pages
   built from these components.
2. **Authentication UI** — login page replacing the placeholder, using the
   prepared token storage + refresh structure.
3. **i18n completeness** — finish Arabic translations; extract more keys.
4. **Accessibility audit** — automated a11y checks (Storybook a11y addon).
5. **Design token documentation** — generate token tables from the TS modules.
6. **Chromatic / visual regression** for the component library.
7. **Route guards** (auth) and lazy-loaded route chunks.
8. **Sentry** error reporting integration with ErrorBoundary.

---

## 15. Deferred Work

| Item | Why deferred |
|------|--------------|
| Business/landing pages | Out of scope for the foundation phase. |
| Authentication UI/flows | Explicitly excluded (structure only). |
| Backend integration in pages | No business pages yet. |
| Full Arabic content | "Structure only" per requirements. |
| Route guards | Requires auth (next phase). |
| Component visual regression | Requires Chromatic/CI — later. |
