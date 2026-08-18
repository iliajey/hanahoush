# Frontend Development Guide

## Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18 + TypeScript (strict) |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3.4 + CSS variables |
| Components | shadcn/ui style (Radix primitives + cva) |
| Server state | @tanstack/react-query |
| HTTP | Axios (interceptors, token storage) |
| Routing | react-router-dom v6 (data router) |
| Animation | Framer Motion + GSAP |
| i18n | i18next + react-i18next |
| Component docs | Storybook 8 |

## Scripts

```bash
npm run dev          # Vite dev server (port 5173)
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # ESLint flat config
npm test             # Vitest
npm run storybook    # Storybook (port 6006)
npm run build        # Production build (chunk-split)
```

## Adding a UI component

1. Create `src/components/ui/<name>.tsx` following shadcn conventions
   (`cn()`, cva variants, `forwardRef`, Radix where needed).
2. Export it from `src/components/ui/index.ts`.
3. Add a `<name>.stories.tsx` so it is documented in Storybook.
4. Add a Tailwind token if the component needs new design tokens.

## Environment variables

See `.env.example`. `VITE_API_BASE_URL` is consumed by the Axios client.

## Code style

- `import type` for type-only imports (`verbatimModuleSyntax`).
- Feature code goes to `src/features/` (future); shared code to `shared/`.
- RTL-safe: use `ms-*` / `me-*` / `start-*` / `end-*` logical utilities.
