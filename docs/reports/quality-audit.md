# Hanahoush — Quality Audit

> Phase 6.5 audit of the Hanahoush Enterprise Platform.
> Every finding includes **Severity**, **Status**, and **Recommendation**.
> Severity: 🔴 High · 🟠 Medium · 🟡 Low · ⚪ Info.

---

## Security

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| SEC-01 | Dev `SECRET_KEY` in `.env` (`local-dev-secret-not-for-production`) triggers `check --deploy` warning | 🟠 Medium | Known (env) | Inject a strong random key via env in all non-dev environments. |
| SEC-02 | Demo passwords are hard-coded in `seeders.py` (by design) | 🟡 Low | Accepted | Demo-only; never use in prod. Document and rotate. |
| SEC-03 | Password-reset uses console/locmem email backend in dev | 🟡 Low | Known | Configure real SMTP for production. |
| SEC-04 | `UserSession`/`LoginAttempt` rows never pruned | 🟠 Medium | Open | Add a periodic cleanup job (next phase). |
| SEC-05 | No MFA / email verification | ⚪ Info | Deferred | Planned for a later phase. |

**Overall:** JWT blacklist/rotation, account lockout, rate limiting, password
validators, audit log and session tracking are in place and verified.

---

## Performance

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| PERF-01 | Frontend main bundle ~362 kB (gzip ~116 kB); vendor chunks split | 🟡 Low | OK | Monitor; lazy-load routes/features as they grow. |
| PERF-02 | `/me`, roles, permissions cached client-side (React Query) | ⚪ Info | OK | Keep `staleTime` sane. |
| PERF-03 | No DB query-optimization review for admin list pages this phase | 🟡 Low | Open | Run `django-debug-toolbar`/`explain` on hot admin lists. |
| PERF-04 | Token refresh is single-flight | ⚪ Info | OK | Good for concurrency; add multi-tab sync later. |

---

## Accessibility

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| A11Y-01 | Storybook a11y addon not installed (no automated a11y checks) | 🟠 Medium | Open | Add `@storybook/addon-a11y` and run axe tests on components. |
| A11Y-02 | Radix primitives (dialog, select, switch, tabs, accordion, dropdown) provide ARIA/roving focus | ⚪ Info | OK | Keep using Radix; add keyboard tests. |
| A11Y-03 | Manual contrast check on dark palette not performed | 🟡 Low | Open | Run a contrast audit against WCAG AA. |

---

## Code Duplication

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| DUP-01 | No meaningful duplication found; base viewset/serializer/filter mixins centralize logic | ⚪ Info | OK | Continue reusing `config.api.base` for new features. |

---

## Dead Code

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| DEAD-01 | `apps/user` phase-1 scaffold app (empty, no models) | 🟡 Low | Retained intentionally | Keep (architectural reference) or remove once documented. |
| DEAD-02 | `apps/common/seed.py` module not yet wired to a command | 🟠 Medium | Open | Wire via `seed_data`/`reset_demo` commands (pending). |
| DEAD-03 | `@testing-library/user-event` installed but unused | 🟡 Low | Open | Use in component tests or remove. |
| DEAD-04 | `styles/index.css` removed earlier; no orphan src files confirmed | ⚪ Info | OK | None found by import-graph review. |

---

## Unused Packages

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| UNUSED-01 | No unused runtime dependencies (all `dependencies` are imported) | ⚪ Info | OK | — |
| UNUSED-02 | Dev deps flagged by scanner are config/CLI tools (vite, eslint, tailwind, storybook, typescript) | ⚪ Info | OK | Keep — used by configs/scripts. |
| UNUSED-03 | `@testing-library/user-event` unused (test-time) | 🟡 Low | Open | Use or remove in a maintenance pass. |

---

## Unused Files

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| FILE-01 | Automated orphan scan had false positives (extensionless imports); manual graph confirms no orphaned src files | ⚪ Info | OK | All files reachable from entries or discovered by vitest/storybook. |

---

## Circular Imports

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| CIRC-01 | Import smoke test of all auth/api modules passed | ⚪ Info | OK | — |
| CIRC-02 | `config.api.base` kept as a light package (Phase 4) to avoid DRF settings cycle | ⚪ Info | OK | Do not re-export eagerly. |

---

## Folder Structure

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| STRUCT-01 | Clean separation: `backend/apps/*`, `frontend/src/{app,components,design,features,shared,i18n}` | ⚪ Info | OK | Follow feature-slice pattern for new work. |
| STRUCT-02 | `docs/architecture`, `docs/frontend`, `docs/components`, `docs/adr`, `docs/reports` | ⚪ Info | OK | Keep ADRs updated per decision. |

---

## Naming Convention

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| NAME-01 | Consistent snake_case (Python), PascalCase components, camelCase hooks/functions | ⚪ Info | OK | Enforced by ESLint/typescript-eslint. |
| NAME-02 | Role codenames uppercase (`SUPER_ADMIN`), permission codenames lowercase dotted (`articles.view`) | ⚪ Info | OK | Consistent with backend/DRF conventions. |

---

## Documentation

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| DOC-01 | `AUTH_FLOW.md`, `README`, ADRs, reports present | ⚪ Info | OK | Keep in sync with code. |
| DOC-02 | OpenAPI documents all 20 paths (12 auth + 8 articles/projects) | ⚪ Info | OK | Auto-generated via drf-spectacular. |

---

## Test Coverage

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| TEST-01 | Backend coverage ~72% (`apps.accounts` + `config.api`) | 🟠 Medium | OK | Add tests for low-coverage serializers (46%) and health edge cases. |
| TEST-02 | Frontend 27 tests; no component tests for LoginForm/ProfileMenu yet | 🟠 Medium | Open | Add RTL component tests for auth forms/menu. |
| TEST-03 | No Playwright/e2e suite yet | 🟠 Medium | Deferred | Add end-to-end auth flow when visual testing begins. |

---

## Backend Lint (ruff)

| # | Finding | Severity | Status | Recommendation |
|---|---------|----------|--------|----------------|
| RUFF-01 | 127 findings: 74×E501 (long lines), 16×F401 (unused imports), 11×I001 (import order), 6×W292, 9×S10x (demo passwords), misc | 🟠 Medium | Open | Run `ruff check apps config --fix` + `ruff format` in a maintenance pass (frozen this phase). |
| RUFF-02 | New Phase 6.5 files: 6×E501, 1×I001, 1×S106 (demo password) | 🟡 Low | Open | Wrap long lines; S106 accepted for demo credentials. |

---

## Summary

- **High severity:** none.
- **Medium:** 10 (a11y tooling, session cleanup, coverage gaps, lint debt, pending CLI commands).
- **Low:** 9 (demo passwords, bundle size, scaffold app, unused test dep).
- **Info:** remaining items OK.

**Actions completed this phase:** backend + frontend verification, bootstrap
provisioning verified, demo users/roles/permissions verified, import-cycle
check, ruff audit, reports generated.
