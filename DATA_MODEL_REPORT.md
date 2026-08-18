# Hanahoush — Data Model & Django Domain Layer Report

> Phase: domain models + database schema + Django Admin registration.
> Scope: 8 Django apps, 26 concrete tables, 0 business APIs/logic implemented.

---

## 1. Summary

| Item | Value |
|------|-------|
| Apps created | `core`, `accounts`, `media_library`, `articles`, `projects`, `services`, `company`, `analytics` |
| Concrete models | **26** |
| Abstract models (core) | `BaseModel`, `SluggedNamedModel`, `PublishableModel` |
| Custom user model | `accounts.User` (extends `AbstractUser`, set via `AUTH_USER_MODEL`) |
| Migration files | 7 (`0001_initial` per model-bearing app; `core` is abstract-only → no migration) |
| Migrate result | All migrations applied successfully (validated on SQLite; schema is PostgreSQL-agnostic) |
| Admin registration | 26/26 models registered with `ModelAdmin` |

---

## 2. Folder tree (new apps)

```
backend/apps/
├── core/              # ABSTRACT domain foundations (no tables)
│   ├── apps.py, models.py, admin.py, migrations/__init__.py, tests.py
├── accounts/          # User, Role, Permission
├── media_library/     # MediaFile
├── articles/          # Category, Tag, Article
├── projects/          # ProjectCategory, Technology, Project, ProjectImage
├── services/          # ServiceSection, Service
├── company/           # AboutPage, TeamMember, Partner, Testimonial, FAQ,
│                      #   Timeline, SocialLink, Office, SiteSettings
├── analytics/         # Visitor, PageView, ContactRequest, Newsletter
└── user/              # Phase-1 reference scaffold (kept untouched, no models)
```

Settings changes (configuration only — no structural change):
- `AUTH_USER_MODEL = "accounts.User"` (was `auth.User`).
- New apps added to `LOCAL_APPS`.
- `LANGUAGES` extended with Arabic: `en`, `fa`, `ar`.

---

## 3. Abstract domain bases (`apps.core`)

### `Status` (choices enum, no table)
`draft`, `review`, `published`, `archived`.

### `BaseModel(TimeStampedModel)` — every concrete model inherits this
| Field | Type | Why it exists |
|-------|------|---------------|
| `id` | BigAutoField | Primary key (project-wide `DEFAULT_AUTO_FIELD`). |
| `created_at` / `updated_at` | DateTime (auto) | Audit timestamps — inherited from the shared kernel (`apps.common.TimeStampedModel`). |
| `created_by` / `updated_by` | FK → `accounts.User` (SET_NULL, null, editable=False) | **Audit trail** — who created/updated each record; preserved on user deletion. Reverse names use `%(app_label)s_%(class)s_{created,updated}` to avoid clashes. |
| `is_active` | Boolean (default True, indexed) | Soft "enabled" flag for managers/querysets. |
| `is_deleted` | Boolean (default False, indexed, editable=False) | **Soft delete** flag — rows are never hard-deleted (ERP audit readiness). |
| `deleted_at` | DateTime (null) | When it was soft-deleted (supports restore + analytics of deletions). |

Methods: `soft_delete()`, `restore()`.

### `SluggedNamedModel(BaseModel)` — taxonomy entities
| Field | Type | Why it exists |
|-------|------|---------------|
| `title_fa` / `title_en` / `title_ar` | Char(255) | **Multilingual names.** `title_en` is the required canonical name; `fa`/`ar` are already in the schema so future i18n needs no migration. |
| `slug` | SlugField(255, unique, `allow_unicode`) | URL identifier; Unicode allowed for Arabic/Persian slugs. |
| `sort_order` | PositiveInteger (indexed) | Manual ordering (draggable CMS lists). |

### `PublishableModel(SluggedNamedModel)` — every publishable entity
| Field | Type | Why it exists |
|-------|------|---------------|
| `title_*`, `slug`, `sort_order` | (inherited) | Multilingual naming + URL + ordering. |
| `short_description_*` | Text | Listing/excerpt text per language (index pages, cards). |
| `description_*` | Text | Full body content per language. |
| `status` | Char choices | Publishing lifecycle: Draft → Review → Published → Archived. |
| `is_featured` | Boolean (indexed) | Featured on homepage/carousels. |
| `is_public` | Boolean (indexed) | Public visibility independent of workflow status. |
| `published_at` | DateTime (indexed) | When it went/will go live (scheduling + ordering). |
| `meta_title` | Char(70) | SEO `<title>`. |
| `meta_description` | Char(160) | SEO meta description. |
| `meta_keywords` | Char(255) | SEO keywords. |
| `canonical_url` | URL(500) | Canonical link (dedupe/hreflang readiness). |
| `og_image` | FK → `media_library.MediaFile` (SET_NULL) | OpenGraph share image — normalized reference, not a path. |

**Why an abstract base?** All multilingual + SEO + lifecycle fields are
declared once and inherited by `Article`, `Project`, `Service`, `AboutPage`.
This is the core of the normalization strategy: **one definition, many users,
zero duplicated DDL.**

---

## 4. `apps.accounts`

| Model | Fields (beyond base) | Relationships | Why |
|-------|----------------------|---------------|-----|
| `User(AbstractUser)` | `role` FK, `phone` Char(20), `preferred_language` Char(5) | `role` → `Role` (SET_NULL, null); `groups`, `user_permissions` M2M (from AbstractUser) | Custom user extends Django properly; role + locale are CMS/ERP needs. |
| `Role` | `name`, `codename`(unique), `description`, `is_system` | M2M → `Permission` | Named permission bundles (admin/editor/manager) for future RBAC. |
| `Permission` | `name`, `codename`(unique), `module`, `description` | — | Codename-based custom ACL, decoupled from `django.contrib.auth` internals. |

`User.objects = UserManager()`; default `is_active=True` from AbstractUser.

**Normalization:** a user has exactly one primary `Role` (FK); a role groups
many permissions (M2M); permissions are single-source-of-truth codenames.

---

## 5. `apps.media_library`

| Model | Fields | Relationships | Why |
|-------|--------|---------------|-----|
| `MediaFile` | `file` FileField, `original_name`, `alt_text_*`, `caption_*`, `mime_type`, `size`, `width`, `height`, `sha256`(indexed), `is_public` | `created_by` FK → User (audit) | **Centralized assets**: every content app references a `MediaFile` by FK instead of storing file paths → no duplicated binaries, single content-addressable store. `sha256` enables dedup; `width`/`height` feed future thumbnail variants. |

---

## 6. `apps.articles`

| Model | Fields (beyond base) | Relationships | Why |
|-------|----------------------|---------------|-----|
| `Category` | `parent` FK(self), `description_*` | `parent` → `Category` (PROTECT, null); reverse `children` | Hierarchical taxonomy (self-referencing is normalized — no denormalized path column). |
| `Tag` | — | M2M from `Article` | Shared free-form tagging. |
| `Article` | `is_pinned`, `cover_image` FK, `author` FK | `category` → `Category` (PROTECT, null); `tags` M2M → `Tag`; `author` → `User` (PROTECT, null); `cover_image` → `MediaFile` (SET_NULL) | `author` is the published **byline**, kept separate from the audit `created_by`. View counts are intentionally NOT stored here (they live in `analytics.PageView` — see normalization). |

Indexes: `(status, is_public, published_at)`, `(category, status)`.

---

## 7. `apps.projects`

| Model | Fields (beyond base) | Relationships | Why |
|-------|----------------------|---------------|-----|
| `ProjectCategory` | `parent` FK(self) | parent/children | Hierarchical portfolio taxonomy. |
| `Technology` | `icon`, `website` | M2M from `Project` | Stack described once, reused across projects. |
| `Project` | `client`, `location`, `start_date`, `end_date`, `live_url`, `cover_image` FK | `category` → `ProjectCategory`; `technologies` M2M → `Technology`; `cover_image` → `MediaFile` | Portfolio entity with normalized gallery (below). |
| `ProjectImage` | `alt_text_*`, `sort_order`, `is_cover` | `project` → `Project` (CASCADE); `image` → `MediaFile` (PROTECT) | **Normalized gallery** (1-N rows) instead of a denormalized JSON list of paths; each image has its own alt text + order. |

Indexes: `(status, is_public, published_at)`, `(category, status)`.

---

## 8. `apps.services`

| Model | Fields (beyond base) | Relationships | Why |
|-------|----------------------|---------------|-----|
| `ServiceSection` | `description_*`, `icon`, `cover_image` FK | `cover_image` → `MediaFile` | Top-level grouping of the services page (multilingual name/slug/description). |
| `Service` | `icon`, `cover_image` FK | `section` → `ServiceSection` (PROTECT, null); `cover_image` → `MediaFile` | Publishable service offer. |

Indexes: `(status, is_public, published_at)`, `(section, status)`.

---

## 9. `apps.company`

| Model | Fields (beyond base) | Relationships | Why |
|-------|----------------------|---------------|-----|
| `AboutPage` | `hero_image` FK, `mission_*`, `vision_*` | → `MediaFile` | Single publishable about page. |
| `TeamMember` | `name`, `position_*`, `bio_*`, `email`, `linkedin_url`, `sort_order` | `avatar` → `MediaFile` | Team profiles. |
| `Partner` | `name`, `website`, `description_*`, `sort_order` | `logo` → `MediaFile` | Partner logos (one FK, not duplicated paths). |
| `Testimonial` | `author_name`, `author_role`, `company`, `content_*`, `rating`, `is_featured`, `sort_order` | `avatar` → `MediaFile` | Client testimonials. |
| `FAQ` | `question_*`, `answer_*`, `category`, `is_featured`, `sort_order` | — | FAQ entries. |
| `Timeline` | `title_*`, `content_*`, `date`, `icon`, `sort_order` | — | Company milestones/history. |
| `SocialLink` | `platform` (choices), `label`, `url`, `icon`, `sort_order` | — | Social profiles. |
| `Office` | `name`, `address_*`, `city`, `country`, `lat/long` (Decimal), `phone`, `email`, `map_embed_url`, `is_headquarters`, `sort_order` | — | Office locations (geo stored as Decimal, not floats). |
| `SiteSettings` | `site_name`, `tagline_*`, `contact_email`, `contact_phone`, `address_*`, `default_locale`, `supported_locales` (JSON), `maintenance_mode`, `meta_title`, `meta_description`, `analytics_code` | `logo`, `favicon` → `MediaFile` | **Singleton** global settings; `get_settings()` returns/creates the single row; admin forbids adding a 2nd row. |

---

## 10. `apps.analytics`

| Model | Fields (beyond base) | Relationships | Why |
|-------|----------------------|---------------|-----|
| `Visitor` | `session_key`(unique), `ip_address`, `user_agent`, `referrer`, `first_seen`, `last_seen`, `visit_count` | `user` → `User` (SET_NULL, null) | One row per browser session — IP/UA/referrer stored **once**, not repeated per view. |
| `PageView` | `path`, `query_string`, `method`, `status_code`, `referrer`, `ip_address`, `user_agent`, `browser`, `device_type`, `os_name`, `language`, `timestamp` | `visitor` → `Visitor` (CASCADE); `user` → `User` (SET_NULL, null) | Append-only fact table (one row per request). |
| `ContactRequest` | `name`, `email`, `phone`, `company`, `subject`, `message`, `status` (new/in_progress/resolved/closed/spam), `source`, `handled_at` | `handled_by` → `User` (SET_NULL, null) | Contact form intake feeding CRM (hanRP). |
| `Newsletter` | `email`(unique), `source`, `language`, `unsubscribe_token`(UUID, unique), `unsubscribed_at` | — | Subscriptions; unique email + token for one-click unsubscribe. |

Indexes: PageView `(visitor, timestamp)`, `(path, timestamp)`; ContactRequest `(status, created_at)`.

---

## 11. Database normalization decisions

1. **Centralized multilingual columns.** Translatable text is stored as
   dedicated `*_fa` / `*_en` / `*_ar` columns declared once in the abstract
   bases. This keeps the schema simple, indexable and queryable with plain
   SQL. A row-based translation table was **deliberately postponed** (see §14).
2. **Shared lifecycle/audit fields.** `created_by`, `updated_by`, `is_active`,
   `is_deleted`, `deleted_at`, timestamps are defined once in `BaseModel`.
3. **Centralized asset references.** No content model stores file paths;
   everything points to `media_library.MediaFile` by FK → zero duplicate
   binaries, single source of truth for metadata.
4. **Taxonomy normalized.** `Category`, `ProjectCategory`, `Tag`,
   `Technology`, `ServiceSection` are standalone tables referenced by FK/M2M,
   never duplicated as string columns.
5. **Galleries as rows.** `ProjectImage` is a proper 1-N table (per-image
   alt text + ordering), not a JSON list.
6. **Self-referencing trees** (`Category.parent`, `ProjectCategory.parent`)
   instead of denormalized `level`/`path` columns.
7. **No redundant counters.** Article view counts are not stored on
   `Article`; they derive from `analytics.PageView`. `uploaded_by` on media
   is not duplicated because `created_by` already covers it.
8. **Audit vs byline separated.** `created_by` (who operated) vs `author`
   (published byline) are distinct fields with distinct semantics.
9. **Soft deletes everywhere** — rows are never destroyed, protecting
   historical/ERP data and enabling reversible trash flows.
10. **One primary role per user** (FK) — simple, predictable RBAC; many-role
    assignment can be layered later if needed.

---

## 12. ER Diagram (text)

```
accounts.Role 1───N accounts.User                      (role → users)
accounts.Role N───M accounts.Permission                (role.permissions)

media_library.MediaFile ──< created_by/updated_by/author (audit FKs to accounts.User on many tables, omitted for brevity)

articles.Category 1───N articles.Category              (parent → children)
articles.Category 1───N articles.Article
articles.Tag      N───M articles.Article
accounts.User     1───N articles.Article               (author)
media_library.MediaFile N───1 articles.Article         (cover_image, og_image)

projects.ProjectCategory 1───N projects.Project
projects.Technology      N───M projects.Project
projects.Project         1───N projects.ProjectImage
media_library.MediaFile N───1 projects.ProjectImage    (image)
media_library.MediaFile N───1 projects.Project         (cover_image, og_image)

services.ServiceSection 1───N services.Service
media_library.MediaFile N───1 services.Service         (cover_image, og_image)

company.AboutPage, TeamMember, Partner, Testimonial, SiteSettings ──> media_library.MediaFile (images/logos)

analytics.Visitor 1───N analytics.PageView
accounts.User     N───1 analytics.Visitor              (user)
accounts.User     N───1 analytics.PageView             (user)
accounts.User     N───1 analytics.ContactRequest       (handled_by)

Relationships legend: 1───N one-to-many · N───M many-to-many · 1───1 one-to-one
OneToOne is intentionally used nowhere yet (no profile/singleton-pair exists).
```

---

## 13. Admin registration summary

| App | Model | Admin highlights |
|-----|-------|------------------|
| accounts | `User` | `UserAdmin` (Django) + Profile fieldset (role, phone, language); search on username/email/phone; filter by role/groups. |
| accounts | `Role` | `filter_horizontal` permissions, search, `is_system` readonly. |
| accounts | `Permission` | search by name/codename/module. |
| media_library | `MediaFile` | fieldsets File/Multilingual/Visibility; readonly `size/mime/width/height/sha256`. |
| articles | `Category` / `Tag` | slug prepopulation, parent autocomplete, multilingual search. |
| articles | `Article` | `PublishableAdminMixin` fieldsets (Content/Publishing/SEO/Audit), inlines-free, autocomplete category/tags/author/images, `list_editable` status/featured/pinned. |
| projects | `ProjectCategory` / `Technology` | taxonomy admin. |
| projects | `Project` | publishable fieldsets + **`ProjectImage` TabularInline**, autocomplete, `list_editable`. |
| projects | `ProjectImage` | list/filter/search on project + image. |
| services | `ServiceSection` / `Service` | taxonomy + publishable admin. |
| company | 9 models | dedicated admin per model; `SiteSettings` is **singleton** (add blocked when 1 exists, delete forbidden). |
| analytics | `Visitor` / `PageView` | fact tables — `PageView` add blocked (rows come from tracking); readonly audit/timestamp. |
| analytics | `ContactRequest` | status `list_editable`, filter by status/source, handled_by autocomplete. |
| analytics | `Newsletter` | search, readonly token/dates. |

Shared admin mixins live in `apps/core/admin.py` (`BaseAdminMixin`,
`PublishableAdminMixin`, `SluggedAdminMixin`): consistent audit fields,
SEO fieldset, slug prepopulation and automatic `created_by`/`updated_by`
stamping. Admin **theme is unchanged** (default Django admin).

---

## 14. Migration results

```
$ python manage.py makemigrations        → 7 migration files created
$ python manage.py migrate               → all applied OK:

contenttypes.0001..0002 OK · auth.0001..0012 OK · accounts.0001 OK
admin.0001..0003 OK · analytics.0001 OK · media_library.0001 OK
articles.0001 OK · company.0001 OK · projects.0001 OK
services.0001 OK · sessions.0001 OK

System checks: config.settings.local / production / ci  → 0 issues
AUTH_USER_MODEL = accounts.User   (custom-user swap applied cleanly)
26/26 models registered in admin   (verified programmatically)
```

> Migration validation used the architecture's CI SQLite fallback because the
> local PostgreSQL instance is not accessible with the current credentials.
> Django migrations are database-agnostic; the generated schema applies to
> PostgreSQL unchanged (verified by `sqlmigrate`). Production target remains
> PostgreSQL.

---

## 15. Future scalability decisions

1. **Row-based translation table** can replace/aux `*_fa/en/ar` columns if
   locale count grows — the `PublishableModel` abstraction isolates the change
   to one place.
2. **RBAC ready for hanRP** — `Role`/`Permission` are independent of Django
   auth internals; DRF permission classes (later) can map directly onto them.
3. **Media content-addressability** — `sha256` + centralized store enables
   dedup, CDN sync and future S3/object-storage swap with a storage backend
   change only.
4. **Append-only analytics** supports aggregation/rollups without locking;
   `Visitor` normalization keeps fact rows small.
5. **Soft delete everywhere** → ERP reconciliation can trust row survival.
6. **`SiteSettings` singleton + `default_locale`/`supported_locales`** prepare
   for multi-tenant and per-language canonical/robots generation.
7. Composite indexes already cover the hot read paths (published lists,
   category/status scoping, visitor+time, path+time).

---

## 16. Intentionally postponed

- **Authentication flows** (register/login/token views, password reset, MFA)
  — models exist; no views/serializers created.
- **Business logic** (queryset managers for "published", slug auto-generation,
  status transitions, upload-time hash/mime extraction) — schema is ready.
- **APIs / serializers / views** — none created.
- **Frontend pages / admin theme customization** — none.
- **Row-based translations, Django `sites` framework, `django.contrib.postgres`
  (search/trgm), Celery-based analytics ingestion** — future phases.
- **`apps.user` phase-1 scaffold** — retained untouched per the "no rename /
  no structural change" constraint; `accounts` is the authoritative user app.
- **Deleting/archiving data flows** — soft-delete primitives exist; admin
  integration (bulk archive) is a later concern.
- **PostgreSQL execution** — verified against SQLite via CI settings; apply
  `manage.py migrate` against PostgreSQL once credentials are configured.
```
