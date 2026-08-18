# ADR-0002 — Design tokens strategy

- **Status:** Accepted
- **Date:** 2025-08-04
- **Applies to:** frontend theming

## Context

The design system must support light/dark themes, RTL/LTR, and the Hanahoush
brand. Styling decisions should be centralized and consistent.

## Decision

- **CSS variables are the source of truth** for runtime theming (in
  `src/styles/globals.css`): semantic color tokens (`--background`,
  `--primary`, …) + brand scale (`--brand-*`), defined per theme.
- **TypeScript token modules** in `src/design/tokens/` mirror the CSS
  variables (colors, typography, spacing, radius, shadow, animation) for
  JS/Storybook use.
- **Tailwind maps to the variables** via `hsl(var(--token))` so utilities
  (`bg-primary`, `text-muted-foreground`, …) are theme-aware.
- **Theme switching** toggles the `dark` class + `data-theme` attribute on
  `<html>`; semantic tokens resolve automatically.
- **Spacing is not overridden in Tailwind** — the token scale matches
  Tailwind's built-in spacing, and overriding `theme.spacing` triggers a
  circular-reference crash in Tailwind 3.4 config resolution.

## Consequences

- One place to change brand/theme values (CSS variables + TS tokens).
- Components never hard-code colors; they use semantic utilities.
- Dark mode and RTL work without component changes.
