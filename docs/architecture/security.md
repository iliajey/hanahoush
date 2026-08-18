# Security Architecture (Phase 8H)

## Model

- **AuthN**: JWT (SimpleJWT) — access 30 min, refresh 7 d, rotation + blacklist. Custom `User`
  with roles/permissions; account lockout (5 attempts / 15 min) + login audit.
- **AuthZ**: `IsAdminUser` (superuser or admin role), `IsStaffOrAdmin` (dashboard), and
  `IsStaffOrReadOnly` — reads public, writes staff-only (publishable content viewsets). Editorial
  endpoints use workflow ACL codenames.
- **Throttling**: scoped rates for login (10/min), refresh (30/min), password_reset (5/h), user
  (120/min), contact (10/min), newsletter (5/min), **search (60/min)**, **analytics (120/min)**.

## Headers

`SecurityHeadersMiddleware` (`config/middleware/security_headers.py`) sets on every response:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Cache-Control: no-store` on `/api/v1/auth/*` and `/api/v1/admin/*`

Production additionally sets HSTS, `SECURE_SSL_REDIRECT`, secure cookies,
`SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS=DENY` (`config/settings/production.py`).

## Key rules

- **No secrets in responses or logs.** Dashboard payload is staff-only and tested to contain no
  `secret_key`/`password`/`token`/`signing`. Health exposes no internals publicly; the migration
  check is staff-only. `SECRET_KEY` is required in production settings.
- **Write surface.** Anonymous writes on `Article`/`Project`/`Service` were a HIGH finding and are
  now blocked (401). The Django admin remains the primary write surface.
- **Uploads.** Media API is `IsAdminUser`; filename sanitization, extension/MIME validation,
  Pillow verification, size cap (`MEDIA_MAX_UPLOAD_SIZE`). SVG is allowed but executable
  extensions are blocked.
- **Contact/newsletter.** Honeypot + status=spam; throttled; unsubscribe tokens never exposed;
  newsletter admin is staff-only.
- **Analytics.** Ingestion throttled, batch-capped, allowlist-able; credential-like metadata keys
  are scrubbed on the client and there are no credential columns on `AnalyticsEvent`.
- **CSRF/CORS.** API is token-based (JWT Bearer); CSRF middleware retained for admin;
  `CORS_ALLOWED_ORIGINS` + `CSRF_TRUSTED_ORIGINS` scoped; credentials allowed only for the SPA.

## Findings by severity (audit result)

| Severity | Finding | Status |
|---|---|---|
| CRITICAL | — | none found |
| HIGH | Anonymous writes on publishable viewsets | FIXED (staff-only) |
| HIGH | Missing security/caching headers | FIXED (middleware) |
| MEDIUM | Search/analytics without rate limiting | FIXED (scopes) |
| MEDIUM | Analytics could store credential-like metadata | FIXED (scrub + batch cap) |
| LOW | `ENVIRONMENT` unset (health reported unknown) | FIXED |
| LOW | Health leaked migration state to anonymous | FIXED (staff-only) |
| INFO | Dev `SECRET_KEY` default (prod requires env) | By design |
| INFO | `RedirectRule` enforcement still API-only | Deferred |

## Verification

Covered by `config/api/tests/test_security.py`, write-permission tests in
`test_article_api.py` / `test_project_api.py`, dashboard secret-leak test, and the live smoke
suite (anon write 401, anon dashboard 401, staff write 201).
