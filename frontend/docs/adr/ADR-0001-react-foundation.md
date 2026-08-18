# ADR-0001 — React Foundation stack

- **Status:** Accepted
- **Date:** 2025-08-04
- **Applies to:** frontend foundation

## Context

The Hanahoush frontend needs a stable, enterprise-grade React foundation:
a build tool, styling system, component layer, server-state solution, HTTP
client, router, animation libraries and i18n.

## Decision

- **React 18 + TypeScript (strict)** — runtime and language.
- **Vite 5** — fast dev server, native ESM build, chunk-splitting.
- **Tailwind CSS 3.4** with CSS variables — utility-first styling.
- **shadcn/ui-style components** — Radix primitives + `class-variance-authority`.
- **@tanstack/react-query** — server state.
- **Axios** — HTTP with interceptors.
- **react-router-dom v6** — data router.
- **Framer Motion + GSAP** — animation.
- **i18next + react-i18next** — internationalization.
- **Storybook 8** — component documentation.

## Consequences

- Consistent, typed, testable foundation reused by every future feature.
- Node.js is used **only** as the build/development tool (no server).
- New features add code under `src/features/` without touching shared layers.
