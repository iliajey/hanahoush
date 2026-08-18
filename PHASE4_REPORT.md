# Hanahoush — Phase 4 Report: Backend API Foundation

> Reusable enterprise API infrastructure + CRUD for Article and Project.
> Date: 2025-08-04

---

## 1. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **URL-path versioning** (`/api/v1/`) | Simple, cacheable, cache-friendly, works with any proxy. `config/api/v1.py` is the version module; `/api/v2/` will be a sibling module. |
| **DRF `versioning_class = None` on viewsets** | Versioning is expressed in the URL path; DRF's `NamespaceVersioning` has `default_version=None`, which makes drf-spectacular skip every endpoint. Disabling it on the view keeps schema generation working. |
| **Lightweight package `__init__.py`** for `config.api` and `config.api.base` | Avoids circular imports with DRF's lazy settings resolution (`DEFAULT_PAGINATION_CLASS` resolution during `rest_framework.generics` import) and drf-spectacular. |
| **Swagger wiring in `config/api/swagger.py`** | Kept out of `config/api/__init__.py` so importing the API package never eagerly imports drf-spectacular. |
| **Standard response envelope** `{success, message, data, errors}` | Consistent client contract; plus optional `pagination` and `request_id` keys. |
| **`AllowAny` permissions** | Authentication is intentionally deferred to Phase 5. Viewsets declare `permission_classes` explicitly so adding auth later is localized. |
| **Soft-delete awareness in querysets** | `get_queryset` filters `is_deleted=False` by default (except the `restore` action, which must see soft-deleted rows). |
| **Serializer-per-action** (list / detail / write) | List responses are lightweight; detail responses include nested relations; write serializers exclude computed/read-only fields. |

---

## 2. Reusable Components (`config/api/base`)

| Component | File | Description |
|-----------|------|-------------|
| `DefaultPagination` | `pagination.py` | Page-number pagination; `page`, `page_size` params; max 100; wraps list response with standard envelope + `pagination` dict. |
| `CursorPagination` | `pagination.py` | Cursor-based pagination for large datasets (ready for future heavy endpoints). |
| `HanahoushModelSerializer` | `serializers.py` | Base ModelSerializer with audit fields read-only. |
| `TranslatableFieldsMixin` | `serializers.py` | Adds computed per-language `title`/`description` fields based on request language. |
| `PublishableSerializerMixin` | `serializers.py` | Adds `status_display`, `is_published`, grouped `seo` dict. |
| `NestedMediaFileSerializer` | `serializers.py` | Lightweight media reference serializer with `preview_url`. |
| `BaseFilterSet` | `filters.py` | Common filters: `is_active`, `is_deleted`, date ranges, generic `q`. |
| `PublishableFilterSet` | `filters.py` | Adds `status`, `is_featured`, `is_public`, publish-date ranges. |
| `HierarchicalFilterSet` | `filters.py` | `parent`, `has_children` for trees. |
| `MediaFilterSet` | `filters.py` | `mime_type`, `is_image`, size ranges. |
| `DefaultOrderingFilter` | `ordering.py` | Whitelisted ordering via `ordering_fields`; safe default. |
| `MultiFieldSearchFilter` | `ordering.py` | `q` search param over `search_fields`. |
| `BaseViewSet` | `viewsets.py` | CRUD + soft-delete/restore + `build_response`/`build_error` + pagination/filter/order/search backends. |
| `PublishableViewSet` | `viewsets.py` | Publisehable defaults (status/featured/date ordering, multilingual search); published+public default for anonymous. |
| `build_response` / `build_error` / `hanahoush_exception_handler` | `responses.py` | Standard response helpers + global error handler. |

### Standard response format
```json
{
    "success": true,
    "message": "",
    "data": {},
    "errors": null,
    "request_id": "uuid"
}
```

### Standard error format
```json
{
    "success": false,
    "message": "Validation failed",
    "data": null,
    "errors": {"title_fa": ["..."]},
    "request_id": "uuid"
}
```

---

## 3. Endpoints

### Health / Meta (unversioned, under `/api/`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health/` | DB + cache health check |
| GET | `/api/version/` | API/app/Django version + environment |
| GET | `/api/ping/` | Liveness probe (`pong`) |

### Article CRUD (`/api/v1/articles/`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/articles/` | List (paginated, filterable, searchable, sortable) |
| POST | `/api/v1/articles/` | Create |
| GET | `/api/v1/articles/{id}/` | Retrieve detail |
| PUT | `/api/v1/articles/{id}/` | Full update |
| PATCH | `/api/v1/articles/{id}/` | Partial update |
| DELETE | `/api/v1/articles/{id}/` | Delete |
| POST | `/api/v1/articles/{id}/soft-delete/` | Soft delete |
| POST | `/api/v1/articles/{id}/restore/` | Restore soft-deleted |

### Project CRUD (`/api/v1/projects/`)
Same 8 routes as Article under `/api/v1/projects/`.

### Filtering / Search / Ordering / Pagination params
| Feature | Query params |
|---------|--------------|
| Filtering | `status`, `category`, `category_slug`, `author` (articles), `tags` (articles), `technologies` (projects), `is_featured`, `is_public`, `is_pinned`, `published_after`, `published_before`, `start_date_after/before`, `end_date_after/before` |
| Searching | `q` (matches `title_*`, `description_*`, `slug`, `client`, `location`) |
| Ordering | `ordering` (whitelisted: `title_en`, `created_at`, `updated_at`, `published_at`, `sort_order`, `end_date`; prefix `-` for descending) |
| Pagination | `page`, `page_size` (max 100) |

### Validation
- Publishing (`status=published`) requires non-empty `title_fa` and `description_fa`.
- Duplicate `slug` rejected (400).
- Unknown ids → 404 in standard envelope.

---

## 4. Files Created

| Path | Purpose |
|------|---------|
| `config/api/urls.py` | API root URL wiring (health + v1) |
| `config/api/v1.py` | Version-1 endpoints |
| `config/api/swagger.py` | Swagger/OpenAPI URL wiring |
| `config/api/health.py` | Health / version / ping endpoints |
| `config/api/base/__init__.py` | Package docstring (kept light to avoid import cycles) |
| `config/api/base/pagination.py` | Pagination classes |
| `config/api/base/serializers.py` | Base serializers |
| `config/api/base/filters.py` | Reusable filter sets |
| `config/api/base/ordering.py` | Ordering + search filters |
| `config/api/base/viewsets.py` | Base viewset classes |
| `config/api/base/responses.py` | Response builder + error handler |
| `config/middleware/api_logging.py` | API request logging middleware |
| `apps/articles/api/__init__.py` | Article API package |
| `apps/articles/api/serializers.py` | Article serializers |
| `apps/articles/api/filters.py` | Article filter set |
| `apps/articles/api/viewsets.py` | Article viewset |
| `apps/articles/api/urls.py` | Article router |
| `apps/projects/api/__init__.py` | Project API package |
| `apps/projects/api/serializers.py` | Project serializers |
| `apps/projects/api/filters.py` | Project filter set |
| `apps/projects/api/viewsets.py` | Project viewset |
| `apps/projects/api/urls.py` | Project router |
| `apps/articles/tests/test_article_api.py` | Article API tests |
| `apps/projects/tests/test_project_api.py` | Project API tests |
| `config/api/tests/test_health.py` | Health/versioning tests |
| `CHANGELOG.md` | Updated with Phase 4 |

### Modified Files
| Path | Change |
|------|--------|
| `config/settings/base.py` | `AllowAny`, new pagination class, new exception handler, spectacular settings, `APILoggingMiddleware`, `api.request` logger |
| `config/urls.py` | `include("config.api.urls")`, swagger import path |

---

## 5. Tests & Verification

### Test suite (44 tests, all passing)
| Suite | Tests | Coverage |
|-------|-------|----------|
| `apps/articles/tests/test_article_api.py` | 22 | CRUD, pagination, filtering, search, ordering, validation |
| `apps/projects/tests/test_project_api.py` | 15 | CRUD, pagination, filtering, search, ordering, validation |
| `config/api/tests/test_health.py` | 7 | health/version/ping, standard envelope, 404 handling, versioned routes |

### Verification results
| Check | Result |
|-------|--------|
| `python manage.py check` (local/production/ci) | 0 issues |
| `python manage.py makemigrations --check --dry-run` | No changes (no schema drift) |
| `pytest` (44 tests) | 44 passed |
| `/api/schema/` OpenAPI | 8 paths generated, no warnings |
| `/api/docs/` Swagger UI | 200 |
| `/api/redoc/` ReDoc | 200 |
| Health endpoints | 200 |
| Request-ID logging | logged for every `/api/` request |

---

## 6. Future Improvements

1. **Authentication & authorization** (Phase 5): JWT + RBAC, replace `AllowAny` with permission classes tied to `Role`/`Permission` models.
2. **Throttling**: DRF `DEFAULT_THROTTLE_CLASSES` / scoped throttles for abuse protection.
3. **Remaining CRUD** (Phase 6): services, company, analytics, media library endpoints reusing the same base infrastructure.
4. **Full-text search**: switch `@` prefix to PostgreSQL full-text (`django.contrib.postgres.search`) for the `q` parameter.
5. **Schema extensibility**: add `@extend_schema` on filter params so OpenAPI documents each filter/search/ordering parameter.
6. **Request logging**: add SQL/elapsed breakdowns and structured JSON output.
7. **Caching**: cache-read of `published_at` public list responses; ETag/conditional requests.
8. **Rate-limited health checks** with circuit breaker for cache.
9. **OpenAPI tags/summaries** per resource for better Swagger UX.
10. **Export endpoints** (CSV/XLSX) on list resources reusing admin import-export resources.

---

## 7. Deferred Work

| Item | Why deferred |
|------|--------------|
| Authentication / JWT / refresh / MFA | Explicitly out of scope for Phase 4. |
| CRUD for other models (services, company, analytics, media) | Only Article + Project requested. |
| Frontend API consumption | No frontend changes in this phase. |
| Throttling / rate limits | Will accompany authentication. |
| Full-text search | Requires PostgreSQL + `django.contrib.postgres`. |
| Request/response validation schemas per endpoint | OpenAPI already documents; explicit schemas are a refinement. |
| Multi-language response localization | `TranslatableFieldsMixin` prepared; active negotiation deferred. |
