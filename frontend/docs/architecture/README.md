# Frontend Architecture

The Hanahoush frontend is a **React 18 SPA** built with Vite + TypeScript.

## Folder layout

```
src/
├── app/                    # Application shell
│   ├── providers/          # Provider composition root (AppProviders, ErrorBoundary)
│   ├── theme/              # Theme system (light / dark / system)
│   ├── language/           # Language + RTL/LTR system (fa / en / ar)
│   ├── layouts/            # AppLayout, Navbar, Footer, PageWrapper
│   └── routes/             # Router + route pages (empty placeholders for now)
├── components/
│   ├── ui/                 # shadcn-style UI components (Button, Card, …)
│   └── layout/             # Layout primitives (Container, Section)
├── design/
│   └── tokens/             # Design tokens (colors, typography, spacing, …)
├── shared/
│   ├── api/                # Axios client, AxiosProvider, useApi, token storage
│   ├── hooks/              # Generic hooks (useDebounce, useLocalStorage, …)
│   ├── lib/                # cn() utility
│   ├── types/              # API envelope types
│   └── constants/          # App constants
├── i18n/                   # i18next setup + locale files (en/fa/ar)
└── styles/                 # Tailwind entry + global CSS variables
```

## Principles

1. **Provider composition root** — `AppProviders` owns the order of Theme,
   Language, Query, Axios, Toast and ErrorBoundary. The router sits inside.
2. **Design tokens drive styling** — CSS variables + TS tokens, consumed by
   Tailwind and Storybook. No hard-coded colors in components.
3. **Feature slices later** — future business pages live under
   `src/features/<feature>`; shared UI stays in `components/`.
4. **Server state via TanStack Query** — reads use `useQuery`; imperative
   actions use `useApi`.
5. **RTL/LTR is structural** — `document.dir` flips on language change; all
   spacing uses Tailwind logical properties (`ms`/`me`/`start`/`end`).

## Providers order

```
ErrorBoundary
  └─ ThemeProvider
      └─ LanguageProvider
          └─ QueryProvider
              └─ AxiosProvider
                  └─ ToastProvider
                      └─ RouterProvider (inside AppRouter)
```

See [`docs/adr/`](../adr/) for the decision records behind these choices.
