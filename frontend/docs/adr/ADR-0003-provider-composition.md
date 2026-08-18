# ADR-0003 — Provider composition root

- **Status:** Accepted
- **Date:** 2025-08-04
- **Applies to:** frontend application shell

## Context

The application needs a predictable way to compose cross-cutting concerns
(theme, language, server state, HTTP, notifications, error handling) around
every route.

## Decision

- A single **`AppProviders`** component in `src/app/providers/` is the
  composition root. It nests, in order:

  ```
  ErrorBoundary
    └─ ThemeProvider
        └─ LanguageProvider
            └─ QueryProvider
                └─ AxiosProvider
                    └─ ToastProvider
                        └─ RouterProvider (inside AppRouter)
  ```

- The **router is provided last** so every route inherits all contexts.
- Each provider is a small, single-responsibility module (theme/language
  have their own folders with types + hook + provider).

## Consequences

- Adding a concern = adding one provider in `AppProviders`; no route changes.
- Providers stay decoupled and testable.
- Storybook reuses the same providers as decorators, keeping stories
  faithful to the running app.
