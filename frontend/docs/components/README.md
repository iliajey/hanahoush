# Component Inventory & Conventions

## Form controls

| Component | File | Radix |
|-----------|------|-------|
| Button | `ui/button.tsx` | `@radix-ui/react-slot` |
| Input | `ui/input.tsx` | — |
| Textarea | `ui/textarea.tsx` | — |
| Label | `ui/label.tsx` | `@radix-ui/react-label` |
| Select | `ui/select.tsx` | `@radix-ui/react-select` |
| Checkbox | `ui/checkbox.tsx` | `@radix-ui/react-checkbox` |
| Radio (group) | `ui/radio-group.tsx` | `@radix-ui/react-radio-group` |
| Switch | `ui/switch.tsx` | `@radix-ui/react-switch` |

## Feedback

| Component | File | Notes |
|-----------|------|-------|
| Alert | `ui/alert.tsx` | variants: default/info/destructive/success/warning |
| Toast | `ui/toast.tsx` | Framer Motion based; `useToast()` + `ToastProvider` |
| Spinner / Loading | `ui/spinner.tsx`, `ui/loading.tsx` | |
| Skeleton | `ui/skeleton.tsx` | |
| EmptyState | `ui/empty-state.tsx` | |
| ErrorState | `ui/error-state.tsx` | |

## Data display

| Component | File |
|-----------|------|
| Badge | `ui/badge.tsx` |
| Avatar | `ui/avatar.tsx` |
| Card | `ui/card.tsx` |
| Breadcrumb | `ui/breadcrumb.tsx` |
| Pagination | `ui/pagination.tsx` |
| Tabs | `ui/tabs.tsx` |
| Accordion | `ui/accordion.tsx` |

## Overlays

| Component | File |
|-----------|------|
| Dialog | `ui/dialog.tsx` |
| Modal | `ui/modal.tsx` (convenience wrapper over Dialog) |

## Page / layout

| Component | File |
|-----------|------|
| SectionTitle | `ui/section-title.tsx` |
| HeroContainer | `ui/hero-container.tsx` |
| Grid | `ui/grid.tsx` |
| Container / Section | `components/layout/` |
| AppLayout / Navbar / Footer / PageWrapper | `app/layouts/` |
| ThemeToggle / LanguageToggle | `ui/theme-toggle.tsx`, `ui/language-toggle.tsx` |

## Conventions

- Every component is typed, RTL-safe and documented via a `.stories.tsx`.
- Variants use `class-variance-authority` (`cva`) — e.g. `buttonVariants`.
- All class composition goes through `cn()` (`src/shared/lib/cn.ts`).
- Radix primitives are used for accessibility-sensitive interactive widgets.
