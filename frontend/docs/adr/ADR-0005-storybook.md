# ADR-0005 — Storybook for component documentation

- **Status:** Accepted
- **Date:** 2025-08-04
- **Applies to:** frontend component documentation

## Context

With ~25 reusable UI components, the team needs a live, interactive way to
browse, test and document them, plus a place to render design tokens.

## Decision

- **Storybook 8** (`@storybook/react-vite`) is added as a dev dependency.
- Stories are co-located as `*.stories.tsx` next to each component and are
  auto-documented via `autodocs` tags.
- The **preview decorators** wrap every story in the same providers as the
  app (Theme, Language, Query) and add **toolbar globals** for theme
  (light/dark) and locale (fa/en/ar → RTL/LTR).
- A **Design System/Tokens** story renders colors, typography, radius and
  shadows from `src/design/tokens/`.

## Consequences

- `npm run storybook` gives a live component browser; `npm run build-storybook`
  produces a static site (`storybook-static/`, gitignored).
- Stories double as documentation and manual test harnesses.
- Every new component is expected to ship a story.
