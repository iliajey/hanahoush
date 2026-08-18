# Search Architecture (Phase 8H)

## Overview

Hanahoush has a single, unified site-wide search surface:

- `GET /api/v1/search/` (backend, Django/DRF)
- `/search` page + ⌘K command palette (frontend, `features/search/`)

There is exactly one search API and one search feature slice — no parallel systems.

## Searchable content

Only **published and public** content is ever searched:

- `Article` (status=published, is_public, is_active, not deleted)
- `Project` (same)
- `Service` (same)
- `Page` (status=published, is_active)

Drafts, reviews, archived, scheduled and private records are excluded at the query level, which
reuses the existing CMS publishing rules (single source of truth).

## Backend

### Endpoint

`GET /api/v1/search/` — public, throttled (scope `search`, default `60/min`), standard envelope +
pagination.

| Parameter  | Description |
|------------|-------------|
| `q`        | Required, min length `SEARCH_MIN_QUERY_LENGTH` (default 2), max 100 |
| `type`     | `article` \| `project` \| `service` \| `page` (omit for all) |
| `locale`   | `fa` \| `en` \| `ar` (falls back to `Accept-Language`) |
| `category` | category/section slug filter |
| `ordering` | `relevance` (default) \| `published_at` \| `-published_at` |
| `page`, `page_size` | pagination (page_size ≤ 100) |

### Implementation

- `apps/search/services.py` — type registry (`TYPE_SPECS`), match filter builder, localized field
  resolution, relevance scoring, cross-type sort.
- `apps/search/api/views.py` — parameter validation, pagination, ordering, envelope.
- `apps/search/api/serializers.py` — result + input serializers.

Relevance scoring (deterministic, additive):

1. exact title match (100)
2. title starts with query (80)
3. title contains query (60)
4. any token in title (30)
5. slug exact/prefix/contains (20)
6. token in excerpt (10)
7. token in body (5)

Tie-break by `published_at` descending.

### Why not PostgreSQL full-text / trigram?

- The CI suite runs on **SQLite** (`config.settings.ci`), so a Postgres-only backend would be
  untestable in this environment.
- Trigram/full-text adds migrations + extension dependencies for modest gain at current volumes.
- The ORM approach is token/prefix tolerant, locale aware and uses parameterized queries.

Revisit when content volume grows or CI moves to Postgres (then add `SearchVector`/`GinIndex` +
`pg_trgm` with `GIN` indexes and rank in SQL).

## Frontend

`src/features/search/`:

- `types.ts` — `SearchResult`, `SearchParams`, `SearchResponse`.
- `api.ts` — `fetchSearch()` on the shared axios client (Accept-Language header; no duplicate
  client).
- `hooks.ts` — `useDebouncedValue` (350 ms), `useGlobalSearch` (React Query, locale-scoped keys,
  disabled below min length).
- `components/SearchInput.tsx` — accessible, RTL-safe input with clear button.
- `components/SearchResults.tsx` — grouped results, count, loading/empty/error states.
- `components/SearchCommand.tsx` — ⌘K/Ctrl+K command palette with arrow-key navigation.
- `pages/SearchPage.tsx` — `/search`, URL-driven (`q`/`type`/`category`), `noindex,follow`.

Analytics events (via the single `trackEvent` system): `search_view`, `search_submit`,
`search_result_click`, `search_empty`, `search_filter`.
