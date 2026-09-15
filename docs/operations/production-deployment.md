# Hanahoush — Production Deployment Runbook (Phase 24)

> No credentials, secrets, password hashes, or tokens appear in this runbook.
> Every value below is a placeholder the operator replaces.

Architecture: Django 5.2 + DRF (Gunicorn/WSGI) + WhiteNoise static,
React/Vite SPA (`frontend/dist/`), PostgreSQL via `DATABASE_URL`.
No Docker. No Celery/Redis. No Kubernetes. ERP parked (`ERP_ENABLED=False`).

## 1. Prerequisites

- Linux server (or any host that runs Python + Node), reverse proxy
  (Nginx/Apache/managed) with HTTPS certificate.
- PostgreSQL 16 server + empty database + role.
- Python 3.12+, Node.js 20 LTS+.
- DNS: `app.example.com` (SPA+API host below uses one domain; split if needed).

## 2. Supported runtime versions

- Python 3.12+ (verified 3.14.6). Django 5.2.16, DRF 3.17.1, SimpleJWT 5.5.1,
  psycopg 3.3.4, gunicorn 22.0.0, whitenoise 6.x.
- Node 20 LTS+ (verified v24.18.0), npm 12.0.2, Vite 5.4.
- PostgreSQL 16 recommended (any 14+ works via `DATABASE_URL`).

## 3. Environment variables

Source of truth: `backend/.env.example` (classified REQUIRED / PRODUCTION ONLY
/ OPTIONAL / LOCAL ONLY) and `frontend/.env.example`.
Backend reads `backend/.env` via django-environ; frontend inlines `VITE_*`
at build time.

| Variable | Class | Value in production |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | REQUIRED | `config.settings.production` |
| `DJANGO_SECRET_KEY` | PRODUCTION ONLY | long random, min 50 chars |
| `DJANGO_ALLOWED_HOSTS` | PRODUCTION ONLY | `app.example.com` (no wildcards) |
| `CSRF_TRUSTED_ORIGINS` | PRODUCTION ONLY | `https://app.example.com` |
| `CORS_ALLOWED_ORIGINS` | PRODUCTION ONLY | `https://app.example.com` |
| `DATABASE_URL` | PRODUCTION ONLY | `postgres://USER:PASS@HOST:5432/hanahoush` |
| `SITE_URL` / `FRONTEND_URL` | PRODUCTION ONLY | `https://app.example.com` |
| `DJANGO_SECURE_SSL_REDIRECT` | PRODUCTION ONLY | `True` (behind TLS proxy) |
| `DJANGO_SESSION_COOKIE_SECURE` / `DJANGO_CSRF_COOKIE_SECURE` | PRODUCTION ONLY | `True` |
| `JWT_AUTH_COOKIE_SECURE` | PRODUCTION ONLY | `True` |
| `EMAIL_BACKEND`/`EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`/`EMAIL_USE_TLS`/`EMAIL_USE_SSL`/`EMAIL_TIMEOUT`/`DEFAULT_FROM_EMAIL` | PRODUCTION ONLY | real SMTP |
| `BOOTSTRAP_ADMIN_ENABLED` | OPTIONAL | `False` (default in production.py); `True` only for first boot, then disable |
| `ERP_ENABLED` / `ERP_PROVIDER` | REQUIRED parked | `False` / `null` — do NOT change |
| `GUNICORN_WORKERS`/`GUNICORN_THREADS`/`GUNICORN_PORT`/`GUNICORN_LOG_LEVEL` | OPTIONAL | tune per CPU (default workers = cpu*2+1) |

Frontend build-time: `VITE_API_BASE_URL=https://app.example.com/api/v1`,
`VITE_ENV=production`.

## 4. PostgreSQL setup

```sql
CREATE ROLE hanahoush LOGIN PASSWORD '<redacted>';
CREATE DATABASE hanahoush OWNER hanahoush;
```

Set `DATABASE_URL=postgres://hanahoush:<redacted>@localhost:5432/hanahoush`.
Driver `psycopg[binary]` already in `requirements/base.txt`. Timezone: Django
`USE_TZ=True`, `TIME_ZONE=UTC` — store/compare UTC (`publish_scheduled`
uses `timezone.now()`, DST-safe). Connection health verified via
`/api/health/` (SELECT 1) and gunicorn worker startup.

## 5. Backend installation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/production.txt
cp .env.example .env   # fill PRODUCTION ONLY values, never commit .env
python manage.py check
python manage.py check --deploy
python manage.py makemigrations --check
```

## 6. Migration

```bash
python manage.py migrate
python manage.py showmigrations   # all [X], incl. editorial 0001 + 0002
```

Never reset the DB. Never `--fake` unless restoring a known-good backup.

## 7. Static collection

```bash
python manage.py collectstatic --noinput
```

Verified: `0 copied, 274 unmodified` into `backend/staticfiles/` with
`ManifestStaticFilesStorage`. Served by WhiteNoise (`whitenoise.middleware`
already in `MIDDLEWARE`) from same Gunicorn process. No separate asset
pipeline. `backend/.gitignore` + root `.gitignore` exclude `staticfiles/`.

## 8. Frontend build

```bash
cd frontend
npm install
npm run typecheck && npm run lint
VITE_API_BASE_URL=https://app.example.com/api/v1 VITE_ENV=production npm run build
```

Output `frontend/dist/` (~488kB index chunk, gzip ~159kB). Copy `dist/*`
to web root served by reverse proxy (or WhiteNoise-adjacent static host).
Never serve from `npm run dev` in production.

## 9. Media configuration

`MEDIA_URL=/media/`, `MEDIA_ROOT=backend/media/` (git-ignored, persistent).
`urls.py` serves media via Django **only when `DEBUG=True`** — in production
the reverse proxy must serve `/media/` from `MEDIA_ROOT` directly.
Requirements: persistent volume (survives restart/deploy, NOT inside `dist/`
or `staticfiles/`), writable by gunicorn user, 10MB cap
(`MEDIA_MAX_UPLOAD_SIZE`), extension allowlist + Pillow verification enforced
in code. Back up `MEDIA_ROOT` with the DB (see §17).

## 10. Gunicorn startup

Entry: `config.wsgi:application` (ASGI `config.asgi:application` reserved,
unused — no websocket infra). Config `backend/gunicorn.conf.py`:
bind `0.0.0.0:$GUNICORN_PORT` (default 8000), workers default `cpu*2+1`
(env `GUNICORN_WORKERS`), threads 2 (`GUNICORN_THREADS`), sync class,
timeout 60, graceful 30, keepalive 5, access/error logs to stdout,
loglevel `GUNICORN_LOG_LEVEL`.

```bash
cd backend
DJANGO_SETTINGS_MODULE=config.settings.production gunicorn config.wsgi:application
```

Needs no root (bind high port; proxy forwards 80/443). Verified import-safe;
note: gunicorn runs on Linux (uses `fcntl` — not importable on Windows dev,
production target is Linux).

## 11. Reverse proxy requirements

Proxy (Nginx/Apache/managed) must:

- terminate TLS, forward `Host` + `X-Forwarded-Proto: https`
  (app sets `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`).
- `/api/` → gunicorn `127.0.0.1:8000`; `/admin/` likewise.
- `/static/` → `backend/staticfiles/`; `/media/` → `backend/media/`.
- `/sitemap.xml`, `/robots.txt` → gunicorn (generated live).
- `/api/ping/` liveness (no DB), `/api/health/` readiness (DB+cache).
- SPA fallback: all non-`/api` non-static unknown frontend routes →
  `index.html` (direct load of `/about`, `/projects`, `/services`,
  `/articles`, `/contact`, `/login`, `/dashboard/...`, `/credits` must not 404).
- HTTP → HTTPS redirect (app also sets `SECURE_SSL_REDIRECT=True`).

## 12. HTTPS

Certificate at proxy. App posture (production.py): `SECURE_SSL_REDIRECT=True`,
HSTS 31536000 + subdomains + preload, `SESSION_COOKIE_SECURE=True`,
`CSRF_COOKIE_SECURE=True`, `JWT_AUTH_COOKIE_SECURE=True`,
`SECURE_CONTENT_TYPE_NOSNIFF=True`, `X_FRAME_OPTIONS=DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: geolocation=(), microphone=(), camera=()` via
`SecurityHeadersMiddleware`, `Cache-Control: no-store` on
`/api/v1/auth/*` + `/api/v1/admin/*`. Verified: plain-HTTP `/api/ping/` → 301,
HTTPS → 200.

## 13. Health verification

- Liveness: `GET /api/ping/` → `{"success":true,"message":"pong"}` (no DB).
- Readiness: `GET /api/health/` → DB (`SELECT 1`) + cache + env + version;
  200 healthy / 503 unhealthy. Migration detail only for staff-authenticated
  callers (anonymous sees no internals).
- Version: `GET /api/version/` → `api_version/api_version/app_version/
  django_version/environment`.
- SEO live: `GET /sitemap.xml`, `GET /robots.txt` → 200.

## 14. Email

Used by: password-reset request (`PasswordResetRequestView` → `send_mail`,
enumeration-safe, `fail_silently=True`). Base default is SMTP with env
(`EMAIL_HOST/PORT/USER/PASSWORD/TLS/SSL/TIMEOUT/FROM`); local overrides to
console, CI to locmem. Operator: set real SMTP + `DEFAULT_FROM_EMAIL`
(sender domain aligned with SPF/DKIM). Verify: request reset for a known
account → 200 generic message → SMTP log shows delivery. No bulk/newsletter
send path in production code path beyond contact/newsletter throttled
endpoints.

## 15. Cache

`LocMemCache` (process-local, 300s default; dashboard ops 60s, sitemap 300s,
ERP health 15s). Correct for single-node/single-process start. Multi-worker
gunicorn: each worker holds its own copy — safe because invalidation is
write-through (`_clear_ops_cache` on publish/schedule/cancel; sitemap signals
on content change) and worst case is a ≤60s stale dashboard. No Redis
introduced. If deploying multi-node later, swap `CACHES` to a shared backend
— operator decision, not required now.

## 16. Scheduled publication

Unchanged from `docs/operations/publication-scheduling.md`:
`*/2 * * * * /srv/hanahoush/backend/venv/bin/python
/srv/hanahoush/backend/manage.py publish_scheduled >>
/var/log/hanahoush/publish.log 2>&1`. UTC, idempotent, batch cap 50
(`PUBLISH_DUE_BATCH_SIZE`), per-item failure isolation (`publish.failed`
audit, stays `scheduled` for retry), overlap-safe. Verified `Published 0`
with only far-future schedule present. Do NOT add Celery/Redis.

## 17. Backup

PostgreSQL (example, adapt host/role):

```bash
pg_dump -Fc -h localhost -U hanahoush hanahoush > hanahoush-$(date +%F).dump
```

Frequency: daily full dump; retention 30d; store encrypted off-host
(restrict `0600`, encrypt at rest). Verify monthly: restore to disposable DB
+ `manage.py check` + smoke login. PITR: enable WAL archiving on the
managed Postgres if the provider supports it. Media: snapshot `MEDIA_ROOT`
with each DB dump (same timestamp); restore both together.

## 18. Restore

```bash
createdb -h localhost -U hanahoush hanahoush_restore
pg_restore -h localhost -U hanahoush -d hanahoush_restore hanahoush-<date>.dump
# verify, then promote; restore MEDIA_ROOT snapshot to backend/media/
python manage.py showmigrations   # all [X]
```

Never restore over the live DB without a fresh pre-restore dump. Never
`--clean` against production blindly.

## 19. Rollback

- App: redeploy previous code tag (keep 2 releases on host); restart gunicorn.
- Frontend: keep previous `dist/` copy; swap symlink back.
- Migrations: only roll back if the migration is reversible AND a backup
  exists — `editorial/0002` is choices-only (safe); never auto-reverse
  destructive migrations; prefer forward-fix + restore from backup.
- Static: `collectstatic` from rolled-back tree (manifest hashes change).
- Media: never delete on rollback; uploads are append-only.
- Cron stays running (idempotent) during rollback.

## 20. Post-deploy smoke test

Health → login → `/api/v1/auth/me` → public Home/Articles/Projects/Services →
Dashboard → Media list → Timeline → one draft→publish workflow →
`publish_scheduled` → sitemap/robots → logout. (All verified locally this
phase; see phase-24 report §28.)

## 21. Troubleshooting

- `ImproperlyConfigured: DJANGO_ALLOWED_HOSTS` → set real hosts env.
- `SECRET_KEY` warning → value <50 chars; generate new.
- HTTP 301 on `/api/*` → expected with `SECURE_SSL_REDIRECT`; call https.
- `check --deploy` drf-spectacular W001 → schema cosmetic hints only, safe.
- `import_export ... change_list_template` WARNING → upstream cosmetic, safe.
- Static 404 → run `collectstatic`, check proxy `/static/` mapping.
- Media 404 in prod → proxy `/media/` mapping missing (Django serves only
  with DEBUG).
- DB `connection refused` → `DATABASE_URL` host/creds/firewall.

## 22. Security checklist

`check --deploy` with proper SECRET_KEY: **0 Django security warnings**
(only drf-spectacular W001 schema hints). Confirm: DEBUG=False, real
ALLOWED_HOSTS/CSRF/CORS (no `*`), secure cookies, HSTS, no `.env`/DB in git,
`ERP_ENABLED=False`, bootstrap disabled after first superuser, SMTP creds in
secret store only.
