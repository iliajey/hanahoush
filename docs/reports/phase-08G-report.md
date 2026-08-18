# Phase 8G — Production CMS, Company Experience, Media Management & Contact System

**Status:** ✅ COMPLETE
**Date:** 2026-08-10
**Scope:** Company/About experience · Contact/inquiry system · Media management ·
Newsletter operations · Admin/CMS operational UX · Public SEO · Accessibility · Analytics ·
API quality · Testing · Live verification · Docs

---

## 1. What was implemented

Phase 8G turns Hanahoush into an **operating website** layer on top of the existing
Phase 8F architecture (no restart, no second CMS, no duplicate models/hooks/clients).

- **`/about`** — complete Company/About experience composed by the **Page Builder**
  (`usePage("about")` + `<PageRenderer />`, zero hardcoded layout). 12 CMS-driven
  sections: hero · company_story · about (mission/vision) · values · team · timeline ·
  partners · testimonials · faq · offices · social_links · cta.
- **`/contact`** — production contact/inquiry experience composed by the Page Builder
  (hero · contact_form · offices · social_links · cta) with a full-featured, accessible,
  multilangual inquiry form on top of the existing `ContactRequest` model + API.
- **Media management** — the existing `MediaFile` library upgraded into a usable CMS
  media system: metadata editing (PATCH), usage/reference counts, uploader/type/date
  filtering, soft-delete on API and admin, plus a **reusable `MediaPicker`** frontend
  (drag & drop, progress, preview, search, selection, localized metadata).
- **Newsletter operations** — staff-only admin API on the existing
  `NewsletterSubscription` (search · locale/status/date filters · activate/deactivate ·
  safe CSV export) with strict privacy (tokens never exposed, no public listing).
- **Admin/CMS UX** — improved Django admin (media soft-delete, contact filters, newsletter
  management already registered) and confirmed the existing **real-data dashboard**
  (published/draft articles, projects, services, media, subscribers, contact-by-status,
  recent editorial activity).
- **SEO / social sharing** — robots + Twitter card support added to `useSeoMeta`, all
  audited routes pass robots, canonical, OG and locale-aware metadata; `/about` emits
  `Organization` + `FAQPage` JSON-LD.
- **Accessibility** — labelled fields, `aria-invalid`/`aria-describedby`, `aria-live`
  announcements, Radix focus trapping, keyboard-accessible upload zone, RTL-aware
  messages, reduced-motion respect via existing design tokens.
- **Analytics** — 17 approved event names added as typed helpers over the **single**
  existing `trackEvent` system and wired into components.

## 2. Backend changes

- **OpenAPI/Schema fixes** (blocked the whole API surface from drf-spectacular):
  - Root cause: DRF `NamespaceVersioning` has no `default_version`, so drf-spectacular
    **silently skipped every non-viewset endpoint** (public contact, newsletter,
    page-builder FBVs, site-settings). ViewSets already set `versioning_class = None`.
  - Added `no_versioning` helper in `config/api/base/viewsets.py` and applied it to all
    public `@api_view` FBVs; `ContactSubmitView` sets `versioning_class = None`.
  - Schema is now **valid** (`drf_spectacular.validation.validate_schema` passes).
  - Fixed an invalid inline request schema on `POST /auth/refresh/` (new
    `RefreshInSerializer`).
  - `@extend_schema` added to newsletter + page-builder FBVs with proper request/response
    docs and `tags`.
- **Contact system**:
  - `ContactRequestFilterSet` (status / source / locale / dates / search) — fixes a real
    DRF precedence bug where `filterset_class` silently overrode `filterset_fields`,
    meaning `?status=spam` etc. never filtered.
  - `partial_update` now returns the **full** record via `ContactAdminSerializer` and
    records `handled_by` for in-progress/resolved/closed transitions.
- **Media library**:
  - `MediaUpdateSerializer` (localized title/alt/caption + visibility), `JSONParser`
    added, `MediaUpdateSerializer` used for PUT/PATCH.
  - `MediaFileSerializer` gains `reference_count` + `sha256`.
  - `perform_destroy` → **soft-delete**; `get_queryset` is restore-aware; admin
    `delete_queryset`/`delete_model` are soft too.
  - `MediaFilterSet` now actually applies `mime_type`, `created_by`, `is_public`,
    `is_active`, date range and `q` (the old `filterset_fields` were inert).
- **Newsletter**:
  - Staff `NewsletterSubscriptionViewSet` under `/api/v1/admin/newsletter/`
    (list/search/filter, `deactivate`/`activate` actions, `export` CSV), never exposes
    `unsubscribe_token`, `create` explicitly 405 (only the public subscribe endpoint
    creates).
  - Per-IP throttle on the public subscribe endpoint (scope `newsletter`,
    default `5/min`).
- **Settings**: `MEDIA_MAX_UPLOAD_SIZE` and `THROTTLE_NEWSLETTER` (base + ci).

## 3. Frontend changes

- **Page Builder**: registered 5 new section types (`company_story`, `values`, `offices`,
  `social_links`, `contact_form`) in config + registry; new lazy chunk
  `registry/sections/company-about.tsx`.
- **New feature `src/features/contact/`**: `types`, `api` (`submitContact` over the shared
  axios client), `ContactForm` (react-hook-form + zod, localized validation, honeypot,
  duplicate-submission guard, loading/success/error states, a11y), `analytics`, `index`.
- **New feature `src/features/media/`**: `types`, `api` (list/upload w/ progress/PATCH/
  soft-delete), `MediaPicker` (Radix Dialog picker: search, paginated preview grid,
  drag & drop dropzone, upload progress, localized metadata editor, loading/error/empty),
  DEV console page `/dev/media`.
- **Pages**: `AboutPage` (`usePage("about")` + `<PageRenderer />` + SEO + Organization &
  FAQPage JSON-LD + `about_view`), `ContactPage` (`usePage("contact")` + PageRenderer +
  SEO). Routes `/about` and `/contact` wired (replacing the old About placeholder).
- **SEO**: `useSeoMeta` extended with `robots`, Twitter cards, `og:site_name`, stale-
  noindex cleanup; `JsonLd` structured-data component; all audited page `seoInput`
  helpers now forward `robots`.
- **Analytics wiring**: `TeamSection` (team_member_click), `PartnersSection`/`LogoCloud`
  (partner_click), `TimelineSection` (timeline_interaction), `NewsletterCTA`
  (newsletter_view/submit/success/duplicate/error, localized strings).
- **i18n**: added `about`, `contact`, `newsletter` translation blocks in FA/EN/AR.
- **Tests/setup**: `ResizeObserver` stub added to the shared `setupTests.ts`.

## 4. Models created/modified

**None.** No schema changes were needed — Phase 8G reuses `ContactRequest`,
`NewsletterSubscription`, `MediaFile` and the existing company models
(`AboutPage`, `TeamMember`, `Partner`, `Testimonial`, `FAQ`, `Timeline`, `SocialLink`,
`Office`, `SiteSettings`).

## 5. APIs created/modified

| Endpoint | Change | Auth |
|---|---|---|
| `POST /api/v1/contact/` | fixed OpenAPI schema (was missing); behavior unchanged | public (throttled + honeypot) |
| `GET/PATCH /api/v1/admin/contact/` | proper filters now work; PATCH returns full record + handler | staff |
| `GET/POST /api/v1/media/` (+detail) | JSON metadata editing; `reference_count`; soft-delete destroy; working filters | staff |
| `GET /api/v1/admin/newsletter/` | **new** — searchable/filterable subscriber list | staff |
| `POST /api/v1/admin/newsletter/{id}/deactivate/` · `activate/` | **new** | staff |
| `GET /api/v1/admin/newsletter/export/` | **new** — safe CSV export (no token) | staff |
| `POST /api/v1/newsletter/subscribe/` | **new** throttle + OpenAPI docs | public |
| `POST /api/v1/newsletter/unsubscribe/` | OpenAPI docs | public |
| page-builder / company FBVs | OpenAPI docs; versioning fixed | public |
| `POST /api/v1/auth/refresh/` | valid request schema in OpenAPI | public |

## 6. Admin changes

- **Media**: bulk and single delete are now soft (rows restorable; references keep
  resolving); usage counts already surfaced.
- **Newsletter**: `NewsletterSubscriptionAdmin` (pre-existing) remains the primary
  management surface with locale/status/date filters + activate/deactivate actions;
  new staff API mirrors it for programmatic/export use.
- **Contact**: `ContactRequestAdmin` already listed by status/source with spam/resolved
  bulk actions (kept).
- **Dashboard**: confirmed the existing `HanahoushAdminSite.dashboard_stats()` reports
  **real** counts (published + draft articles, projects, services, media, subscribers,
  contact-by-status, recent `AuditEvent` activity) — no fake numbers, no duplication.

## 7. Page Builder changes

- Backend `SECTION_TYPES` already contained `company_story`, `values`, `offices`,
  `social_links`, `contact_form` (migration 0003); the seed already composes the
  `about` (12 sections) and `contact` (5 sections) Pages.
- Frontend section **registry** now maps those five types to real lazy components;
  PageRenderer/UnknownSectionFallback logic untouched.

## 8. Media system changes

See §2/§3. Backend: metadata PATCH, reference counts, soft-delete, real filters,
uploader/date/type filtering. Frontend: reusable `MediaPicker` with drag & drop,
progress, preview, search, selection, localized alt/title/caption editing, and
loading/error/empty states — built on the existing design system.

## 9. Contact system changes

Verified the pre-existing `ContactRequest` lifecycle satisfies the spec
(new · in_progress · resolved · closed · spam — `resolved` used as the "responded"
state). Added: working status/source/locale filters, full-record PATCH return, handler
recording, envelope + lifecycle + enumeration tests.

## 10. Newsletter changes

- Public subscribe/unsubscribe (8F) kept. Added per-IP throttle and OpenAPI docs.
- Staff operations: search, locale/status/date filters, activate/deactivate, safe CSV
  export — all privacy-tested (no `unsubscribe_token` in any payload).

## 11. Analytics events

Added as typed helpers in `src/features/analytics/domains.ts` over `trackEvent`
(single analytics system):

- About: `about_view` · `team_member_click` · `timeline_interaction` · `partner_click`
- Contact: `contact_form_view` · `contact_form_start` · `contact_submit` ·
  `contact_success` · `contact_error`
- Media: `media_view` · `media_select` · `media_upload`
- Newsletter: `newsletter_view` · `newsletter_submit` · `newsletter_success` ·
  `newsletter_duplicate` · `newsletter_error`

## 12. SEO changes

- `useSeoMeta`: `robots`, `twitter:card/title/description/image`, `og:site_name`,
  googlebot synchronization and stale-noindex cleanup.
- `PageSEO` `robots` forwarded on `/`, `/services`, `/projects`, `/articles`, `/about`,
  `/contact`; detail routes stay indexable by design (drafts 404 server-side).
- `/about` emits `Organization` + `FAQPage` JSON-LD via new `JsonLd` component.

## 13. Accessibility changes

- Contact form: real `<label htmlFor>`, `aria-invalid`, `aria-describedby`, `aria-live`
  status region, focus moved to the success heading, keyboard-navigable, honeypot
  visually hidden + off tab order, reduced-motion through design tokens.
- Media picker: Radix Dialog focus trap, close-on-Esc, labelled search, keyboard-
  accessible dropzone, `aria-pressed` on selected tiles, image alt text.
- RTL-aware and localized messages (FA/AR RTL, EN LTR) via i18n + existing `dir`
  handling. No gratuitous ARIA.

## 14. Security changes

- `versioning_class = None` / `no_versioning` — not a security control but restores
  accurate public API docs.
- Newsletter: staff-only list/export, tokens never serialized, subscribe throttled.
- Media: JSON metadata can't replace binaries; delete is soft; existing upload
  validation (extension + size + Pillow sniffing, sanitized filenames) unchanged.
- Contact: honeypot spam path, per-IP throttle, no visitor enumeration.
- Admin CSV/JSON feeds remain staff-only.

## 15. Files / directories created or modified

**Backend — created:**
- `apps/analytics/api/filters.py`
- `apps/page_builder/api/admin_views.py`
- `apps/page_builder/tests/test_newsletter_admin.py`

**Backend — modified:**
- `config/api/base/viewsets.py` (no_versioning), `config/api/base/filters.py`
- `config/settings/base.py`, `config/settings/ci.py`
- `apps/accounts/api/views.py`, `apps/accounts/api/serializers.py`
- `apps/analytics/api/views.py`, `apps/analytics/tests/test_contact_api.py`
- `apps/media_library/api/views.py`, `apps/media_library/api/serializers.py`,
  `apps/media_library/admin.py`, `apps/media_library/tests.py`
- `apps/page_builder/api/views.py`, `apps/page_builder/api/serializers.py`,
  `apps/page_builder/api/urls.py`
- `apps/company/api/views.py`

**Frontend — created:**
- `src/features/analytics/domains.ts` · `src/features/analytics/tests/domains.test.ts`
- `src/features/contact/` (types · api · analytics · ContactForm · ContactForm.test · index)
- `src/features/media/` (types · api · components/MediaPicker(.test) · dev/ · index)
- `src/features/page-builder/registry/sections/company-about.tsx`
- `src/features/page-builder/stories/company-about.stories.tsx`
- `src/features/cms/seo/JsonLd.tsx`
- `src/app/routes/pages/AboutPage.tsx` · `ContactPage.tsx` · `about-page.test.tsx`

**Frontend — modified:**
- `src/features/page-builder/config/index.ts`, `registry/index.ts`
- `registry/sections/TeamSection.tsx`, `PartnersSection.tsx`, `TimelineSection.tsx`
- `src/components/marketing/partners/PartnerLogo.tsx` (optional `onLogoClick`)
- `src/features/articles/components/NewsletterCTA.tsx`
- `src/features/cms/seo/useSeoMeta.ts`, `seo/index.ts`
- `src/app/routes/index.tsx`, `pages/HomePage.tsx`, `pages/ServicesPage.tsx`,
  `src/features/projects/pages/ProjectsPage.tsx`, `src/features/articles/pages/ArticlesPage.tsx`
- `src/i18n/locales/en`, `fa`, `ar` `translation.json`
- `tests/setup/setupTests.ts`

## 16. Database migrations

**None required.** `python manage.py makemigrations --check --dry-run` → "No changes
detected". `python manage.py migrate` → "No migrations to apply".

## 17. Bootstrap / demo-data changes

No seed changes needed — the existing `seed_company_pages()` (Phase 8 partial) already
creates the published **about** (12 sections) and **contact** (5 sections) Pages with
localized copy + SEO, and `seed_demo_data()` already provides realistic company demo
content (team, partners, testimonials, FAQs, timeline, offices, social links, about).
`bootstrap` verified idempotent; existing users/roles untouched; DB not reset.

## 18. Tests added

**Backend (+18 → 167 total):**
- Contact: standard envelope, error envelope, request-id correlation, status
  transitions + handler recording, no-enumeration, spam counts.
- Newsletter admin: staff-only list, pagination, no-token exposure, locale/search
  filters, deactivate/activate, CSV export (+filtered export), no public listing.
- Media: metadata PATCH (staff-only + localized fields), soft-delete & restore,
  reference_count (0 and >0).
- OpenAPI: contact, media, newsletter(public + admin) documented.

**Frontend (+20 → 122 total):**
- `analytics/domains.test.ts` — all 17 event names + payload (`request_id`).
- `ContactForm.test.tsx` — labelled fields, localized validation (EN + FA/RTL),
  success + duplicate-block, failure, single in-flight submission, accessibility.
- `MediaPicker.test.tsx` — grid render + `media_view`, search, dropped-file upload,
  empty state, selection → onSelect + `media_select`, upload error.
- `about-page.test.tsx` — Page-Builder composition (story/values/offices/socials),
  error state, robots `noindex` honoring.

## 19. Full verification results

| Check | Command | Result |
|---|---|---|
| System check | `python manage.py check` | ✅ 0 issues |
| Migrations | `python manage.py makemigrations --check --dry-run` | ✅ No changes detected |
| Migrate | `python manage.py migrate` | ✅ No migrations to apply |
| Bootstrap | `python manage.py bootstrap` | ✅ idempotent (pages/demo present) |
| Backend tests | `python -m pytest` | ✅ **167 passed** |
| Django runner | `python manage.py test` | ✅ 124 tests, OK |
| TypeScript | `npm run typecheck` | ✅ 0 errors |
| Lint | `npm run lint` | ✅ clean |
| Frontend tests | `npm run test` | ✅ **122 passed** (24 files) |
| Build | `npm run build` | ✅ built in 8.7s |
| Storybook | `npm run build-storybook` | ✅ built (new stories included) |
| OpenAPI | `/api/schema/` + `validate_schema` | ✅ valid |

> **Environment note:** pytest and `manage.py test` use the project's documented
> `config.settings.ci` **SQLite fallback** (`USE_SQLITE=true`), because the local
> `hanahoush` PostgreSQL role lacks `CREATEDB` and the superuser password is unknown.
> No test was skipped/altered to "pass" — the same 167 tests run either way; only the
> backend engine differs on this machine.

## 20. Live routes / endpoints verified (running server)

- `GET /api/v1/pages/{home,services,projects,articles,about,contact}/` → 200, and
  `/pages/about/` returns all 12 sections; `/pages/contact/` returns 5 sections.
- `GET /api/v1/about|team|partners|testimonials|faqs|timeline|offices|social-links|site-settings|navigation|footer|seo/?slug=about` → 200 with localized fields (Accept-Language `en`/`fa` verified).
- `POST /api/v1/contact/` → 201 (+`request_id`, status `new`); invalid → 400.
- `POST /api/v1/newsletter/subscribe/` → 201; duplicate → 409.
- Anonymous `GET /api/v1/admin/contact/`, `/admin/newsletter/`, `/admin/newsletter/export/`, `/media/` → 401.
- Authenticated staff (temporary smoke admin, removed after): admin newsletter search,
  CSV export, media list, contact-by-status — all 200; `unsubscribe_token` never present.
- `GET /api/schema/` → 200 (valid OpenAPI).

## 21. Known issues

- Local Postgres role can't create test databases (see §19): tests run on the SQLite
  fallback in this environment; grant `CREATEDB` to `hanahoush` (or set the superuser
  password) to run against PostgreSQL.
- `missionLabel`/`visionLabel` on the `company_story` section default to English unless
  configured (config-driven by design).
- Analytics remain client-side/in-memory (pre-existing; backend ingestion is Phase 9).
- Client-side SEO (`useSeoMeta`/JSON-LD) requires JS execution; server-side head
  rendering for non-JS crawlers is deferred.
- `analytics.Newsletter` legacy model stays unregistered (documented in 8F/8G).

## 22. Deferred work

- **BLOCKED / environment:** PostgreSQL-backed test DB creation (needs CREATEDB grant).
- **DEFERRED:** `MediaPicker` Storybook story (requires a network-mock decorator);
  server-side HTML sanitizer (bleach) for defense-in-depth; backend analytics ingestion
  endpoint; newsletter CSV import.

## 23. Architectural risks

- **drf-spectacular + NamespaceVersioning:** any future non-viewset `APIView`/`@api_view`
  will be silently dropped from the schema unless it sets `versioning_class = None` or
  uses the `no_versioning` decorator. Mitigation: helper + existing `BaseViewSet`
  convention; documented in this report.
- **DRF `filterset_class` precedence:** `filterset_fields` are inert when a
  `filterset_class` is set. All affected filtersets were moved to real FilterSet
  classes; future listsets must follow suit.
- **Client-side SEO/analytics:** crawlers/social scrapers that don't run JS miss
  meta/JSON-LD until an SSR/prerender layer arrives (tracked in next phase).

## 24. Documentation / report paths

- `docs/reports/phase-08G-report.md` (this file)
- `CHANGELOG.md` (updated)
- `docs/reports/next-phase.md` (updated)
- `NEXT_PHASE.md` (updated)

## 25. Phase 8G status

**COMPLETE.**

## 26. Reasons for any incomplete item

None. All Phase 8G requirements were implemented and verified. The only environmental
limitation (Postgres `CREATEDB`) is explicitly documented and does not affect the code
deliverable — the identical test suite runs green on the project's documented SQLite
CI fallback.