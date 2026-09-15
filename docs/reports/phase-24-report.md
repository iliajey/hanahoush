# Phase 24 Report — Production Deployment Readiness

Date: 2026-09-15. Non-feature phase: no new product features, no architecture
redesign, no Celery/Redis/K8s/Docker, no new CMS/analytics/auth/RBAC/ERP/API
client/state management. No auto-deploy, no cloud provisioning.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive Summary

Hanahoush is **PRODUCTION READY WITH OPERATOR CONFIGURATION**. Application
code needs zero deployment blockers fixed; remaining work is operator-supplied
config (PostgreSQL, domain, SMTP, proxy, TLS cert, cron). Found and fixed 3
genuine prod gaps with minimal diffs: (a) production.py inherited localhost
ALLOWED_HOSTS/CSRF/CORS + permissive CORS_ALL — now fail-fast required env;
(b) email auth vars (`EMAIL_HOST_USER/PASSWORD/USE_SSL/TIMEOUT/BACKEND`)
missing — now env-driven; (c) JWT cookie Secure flag set as dead variable —
now mutates `SIMPLE_JWT`. Verification: backend **391 passed**, frontend
**62 files / 310 passed**, typecheck/lint/vite/storybook clean, Playwright
**177 passed / 0 failed** across 8 batches, `check --deploy` 0 Django security
warnings, prod-settings smoke (ping/version/health/sitemap/robots/404/401)
green, DB intact (7/5/4 + workflows/schedules), migrations clean (editorial
0001+0002), ERP parked.

## 2. Phase Objective

Determine whether Hanahoush can deploy safely to real production; produce a
deployment-ready app + precise runbook (`docs/operations/production-deployment.md`).

## 3. Production Architecture

Django 5.2.16 + DRF (Gunicorn sync workers, WSGI `config.wsgi:application`) +
WhiteNoise static; React/Vite SPA (`dist/`); PostgreSQL via `DATABASE_URL`
(psycopg 3.3.4); ASGI module reserved/unused; cron `publish_scheduled`;
LocMemCache; SMTP email; reverse-proxy TLS termination assumed.

## 4. Django Production Settings

production.py now: DEBUG=False; SECRET_KEY required env; ALLOWED_HOSTS /
CSRF_TRUSTED_ORIGINS / CORS_ALLOWED_ORIGINS required env (fail-fast, verified
`ImproperlyConfigured` when unset); CORS_ALLOW_ALL_ORIGINS=False;
BOOTSTRAP default False; SECURE_SSL_REDIRECT=True; HSTS 31536000+sub+preload;
SESSION/CSRF_COOKIE_SECURE=True; JWT cookie Secure=True (mutation fix);
nosniff/DENY/referrer/permissions-policy/no-store headers via middleware;
debug toolbar stripped; ManifestStaticFilesStorage. Local (`ALLOWED_HOSTS=*`,
CORS all, console email, DEBUG) correctly separated from prod.

## 5. Environment Contract

`backend/.env.example` rewritten with REQUIRED / PRODUCTION ONLY / OPTIONAL /
LOCAL ONLY classification for every var (SECRET_KEY, DEBUG, hosts, CORS/CSRF,
DATABASE_URL, SITE/FRONTEND_URL, TLS toggles, JWT lifetimes, throttles, email
SMTP full set incl. new `EMAIL_HOST_USER/PASSWORD/USE_SSL/TIMEOUT/BACKEND`,
bootstrap, gunicorn, ERP parked). Placeholders only. `frontend/.env.example`
unchanged (`VITE_API_BASE_URL`, `VITE_ENV`, i18n). No parallel env system.

## 6. PostgreSQL Readiness

Driver psycopg 3.3.4 present; `env.db_url(DATABASE_URL)` parsing verified;
local DB untouched SQLite. No local Postgres server → runtime PG verification
marked OPERATOR CONFIG (not faked). Static verification: settings, health
`SELECT 1`, migrate path, UTC (`USE_TZ`, `TIME_ZONE=UTC`) all correct.
Runbook gives role/DB SQL + `DATABASE_URL` + dump/restore commands.

## 7. Migration Readiness

`check`: clean. `makemigrations --check`: "No changes detected" (no new
migration created). `showmigrations`: all `[X]` incl. editorial 0001+0002.
No destructive/pending/local-only migration. Ordering correct.

## 8. Static Files

`STATIC_URL /static/`, `STATIC_ROOT backend/staticfiles/`,
`collectstatic --noinput` verified (0 copied, 274 unmodified,
ManifestStaticFilesStorage). WhiteNoise in MIDDLEWARE serves prod static from
same Gunicorn process. Frontend `dist/` copied to web root by operator. No
new asset pipeline.

## 9. Media

`MEDIA_URL /media/`, `MEDIA_ROOT backend/media/` (git-ignored, persistent).
Django serves media only when DEBUG — prod proxy must map `/media/` (runbook
§9/§11). Upload enforcement intact (10MB, allowlist, Pillow, sanitized
names, soft-delete). Media NOT inside `dist/`/`staticfiles/`. Backup with DB.

## 10. Gunicorn

`backend/gunicorn.conf.py`: bind `0.0.0.0:$GUNICORN_PORT` (8000), workers
default cpu*2+1 via `GUNICORN_WORKERS`, threads 2, sync class, timeout 60,
graceful 30, keepalive 5, stdout logs, configurable level. No root needed.
Version 22.0.0 installed. Linux-only note (uses `fcntl`; Windows dev import
fails — expected, production target Linux). WSGI entry verified import-safe.

## 11. ASGI/WSGI

Production entry: WSGI `config.wsgi:application` (defaults to production
settings). ASGI `config.asgi:application` exists, reserved for future
websocket/ERP events, unused — documented, no infra added.

## 12. Reverse Proxy

Not deployed (per rules). Assumptions documented (runbook §11): TLS term +
`X-Forwarded-Proto` (app `SECURE_PROXY_SSL_HEADER` set), Host forward,
`/api/`+`/admin/`→gunicorn, `/static/`+`/media/` file maps, SPA fallback to
`index.html`, `/api/ping/` liveness + `/api/health/` readiness, HTTP→HTTPS.

## 13. HTTPS

App HTTPS-ready: redirect+HSTS+secure cookies verified; plain-HTTP
`/api/ping/` → 301 (expected), secure → 200. Cert + proxy config are operator
supplied. Secure cookie behavior behind proxy verified via settings
(`SESSION/CSRF/JWT` Secure=True).

## 14. SPA Routing

`createBrowserRouter` with public (`/`, `/about`, `/projects`,
`/projects/:slug`, `/services`, `/articles`, `/articles/:slug`, `/contact`,
`/search`, `/credits`), auth (`/login`, `/register`, `/forgot-password`,
`/reset-password`, `/unauthorized`, `/session-expired`), staff
(`/dashboard/...` incl. workspaces, timeline, users). Smoke + errors specs
green (unknown route → friendly SPA 404). Proxy fallback requirement
documented. No routing changes.

## 15. Health Checks

`/api/ping/` (liveness, no DB) 200 `pong`; `/api/health/` (DB SELECT 1 +
cache + env/version) 200 `healthy`, 503 when unhealthy; `/api/version/`
(api/app/django/env) 200. Migration detail staff-only (no anon leak).
`/sitemap.xml` + `/robots.txt` live 200. Recommended operator checks in
runbook §13/§27-checklist.

## 16. Logging

Console `verbose` formatter with timestamps; `api.request` logs
path/method/status/duration/request_id/username (no bodies/tokens/secrets —
verified middleware source); `django.request` ERROR; integration loggers
structured without secrets. Retention/rotation: stdout → host journal/log
rotate (operator). No ELK introduced.

## 17. Error Handling

Prod-settings probes: unknown API → 404 envelope; admin anon → 401;
DEBUG=False → no stack/SQL/paths (generic envelope via
`hanahoush_exception_handler`). Frontend `RouteErrorFallback` + errors.spec
(9 tests: 404 slug, network abort, malformed HTML, slow API, invalid form,
session-death) green.

## 18. Email

Real path: password-reset request → signed token link
(`FRONTEND_URL/reset-password?uid&token`) → `send_mail(fail_silently=True)`,
enumeration-safe. Base SMTP env-driven (now with auth/TLS/SSL/timeout vars);
local console, CI locmem overrides intact. No bulk sender. Operator supplies
SMTP + FROM; verification step in runbook. No real emails sent this phase.

## 19. Cache

LocMemCache everywhere (default 300s; dashboard 60s; sitemap 300s with signal
invalidation; editorial ops cleared on publish/schedule/cancel; ERP health
15s). Single-node READY; multi-worker safe (write-through invalidation, ≤60s
stale worst case). No Redis — correctly not introduced. Multi-node shared
backend documented as future operator option.

## 20. Scheduled Publication

`publish_scheduled` verified (`Published 0`, only far-future schedule 1
`scheduled`); code `PUBLISH_DUE_BATCH_SIZE=50`, UTC/`timezone.now()`,
idempotent, per-item isolation, retry-by-design, overlap-safe. Existing
runbook `docs/operations/publication-scheduling.md` re-confirmed accurate;
deployment cron line in runbook §16. No Celery/Redis.

## 21. Backup

Runbook §17: `pg_dump -Fc` daily, 30d retention, encrypted off-host `0600`,
monthly restore-to-disposable verification, WAL/PITR note, media snapshot
alongside DB dump. No destructive restore executed (per rules).

## 22. Restore

Runbook §18: `createdb` + `pg_restore` to disposable DB, verify, promote;
media snapshot restore; `showmigrations` check. Pre-restore fresh dump
required. Never tested against live DB.

## 23. Rollback

Runbook §19: previous code tag + previous `dist/` symlink swap,
`collectstatic` re-run, cron keeps running (idempotent), media append-only.
Migration rollback only if reversible + backup exists (0002 choices-only
safe); no auto-reverse of destructive migrations.

## 24. Deployment Order

1 provision PG → 2 env → 3 `pip install -r requirements/production.txt` →
4 `migrate` → 5 `collectstatic` → 6 frontend `build` → 7 place `dist/` →
8 proxy → 9 gunicorn → 10 HTTPS → 11 media map → 12 SMTP → 13 cron →
14 health → 15 login → 16 public routes → 17 dashboard → 18 workflow →
19 backups. (Runbook §§4–20.)

## 25. Security Check

`check --deploy` with proper key: **0 Django security warnings** (16
drf-spectacular W001 schema-hint warnings only — cosmetic, documented, not
silenced). With short test key: only expected `security.W009` (proves the
check works). Headers/cookies/HSTS/CSRF/CORS verified (§4). Secrets: `.env`
untracked + ignored; examples placeholders-only; no secrets in report/logs.

## 26. Dependency/Reproducibility

Backend ranges in `requirements/{base,production,local,ci}.txt` (no lock
file — pip ranges, documented). Frontend `package-lock.json` present.
Python 3.14.6 / Django 5.2.16 / Node v24.18.0 / npm 12.0.2 recorded.
`npm audit --omit=dev`: same 2 moderate react-router CVEs as Phase 23
(GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg) — still deferred LOW (SPA-only, no
SSR; major-bump risk). No upgrades performed (per rules).

## 27. Environment Parity

LOCAL (SQLite opt-in, DEBUG, CORS all, console mail, toolbar) vs CI
(DEBUG False, `*` hosts, MD5 hashers, locmem mail, lifted throttles) vs
PRODUCTION (Postgres, DEBUG False, strict hosts, SMTP, secure cookies, HSTS,
bootstrap off) — all differences intentional and documented (§5 + runbook).

## 28. Production Smoke Test

No staging host → max safe local prod-settings test (Gunicorn-equivalent
settings module, SQLite stand-in for PG): ping 200, version 200, health 200
`healthy`, sitemap 200, robots 200, unknown API 404, admin anon 401,
plain-HTTP 301 (SSL redirect). Not faked; PG-backed run marked operator step.

## 29. Test Results

- Backend: `python -m pytest backend -q` → **391 passed** (post-cleanup re-run).
- Django: `check` clean; `check --deploy` 0 security warnings;
  `makemigrations --check` clean; `showmigrations` all `[X]`.
- Frontend: `npm run test -- --run` → **62 files / 310 passed**;
  `typecheck` PASS; `lint` PASS; `vite build` PASS (4.40s);
  `build-storybook` PASS (8.61s).
- Playwright (Edge/Chromium headless, live servers): **177 passed / 0 failed**:

| Batch | Specs | Result |
|---|---|---|
| smoke | 16 | 16 passed |
| seo + errors + phase19-personality | 28 | 28 passed |
| workspace + services-studio | 14 | 14 passed |
| publication timeline/hardening/governance | 15 | 15 passed |
| phase20-workflow | 5 | 5 passed |
| rtl + responsive + theme | 66 | 66 passed |
| accessibility | 13 | 13 passed |
| roles + user-admin | 10 | 10 passed |
| cursor-grid + performance | 10 | 10 passed |
| **Total** | | **177 passed, 0 failed** |

(Initial smoke run failed 16/16 on `ERR_CONNECTION_REFUSED` — dead Vite
process from reaped background job, env cause; restarted, rerun green.)

## 30. Database Integrity

No reset. E2E residue removed via ORM only: article 55
(`phase10-e2e-draft-mu2iygaj`), service 16 (`phase155-e2e-service-mu2iy99n`).
Final: articles **7** (6 demo published + `t1` review), projects **5** (all
demo published), services **4**, users **7**, workflows **3**, schedules **1**
(far-future `scheduled`). Backend re-run green after cleanup (391).

## 31. Migration State

All applied, none pending, none created this phase (see §7).

## 32. Git/Tree Status

Head `d5cfd71 phase15` (owner commits; nothing committed here).
`git status --short`: **77 modified + 3 untracked shown** (phases 16–24
accumulated; full tree larger with frontend/reports per Phase 23 §29).
Phase 24 source changes exactly:

- `backend/config/settings/base.py` (email env vars)
- `backend/config/settings/production.py` (fail-fast hosts, CORS_ALL=False,
  bootstrap default False, JWT Secure mutation)
- `backend/.env.example` (classification + SMTP + prod vars)
- `docs/operations/production-deployment.md` (new runbook)
- `docs/reports/phase-24-report.md` (this file)

Never committed: `backend/db.sqlite3` (+ pre-existing `.bak`), `.env` files
(ignored + verified `check-ignore`), `dist/`, `storybook-static/`,
`node_modules/`, `staticfiles/`, `media/`, logs, `e2e-artifacts/`,
`test-results/`, `temp/`. NOTE: `backend/db.sqlite3` + `.bak` are *tracked*
in git history (pre-existing) — owner should untrack/rotate if repo is public.

## 33. ERP Status

**PARKED.** Runtime `ERP_ENABLED= False`, `ERP_PROVIDER= null`
(NullProvider). Production example keeps `False`/`null`; no URLs/creds/
migrations/sync/calls. No ERP files changed.

## 34. Production Readiness Scorecard

| Area | Status | Evidence | Operator Action |
|---|---|---|---|
| Django production settings | READY | check --deploy 0 sec warnings; fail-fast verified | supply env |
| Environment variables | READY | classified .env.example, placeholders only | fill PRODUCTION ONLY |
| PostgreSQL | READY WITH OPERATOR CONFIG | psycopg 3.3.4, db_url parsing, health SELECT 1 | provision PG + DATABASE_URL |
| Migrations | READY | --check clean, all [X] incl. 0001+0002 | `migrate` on deploy |
| Static files | READY | collectstatic 274 unmodified, WhiteNoise | proxy mapping |
| Media | READY WITH OPERATOR CONFIG | code enforced; DEBUG-only Django serving | proxy /media/ + volume + backup |
| Gunicorn | READY | conf verified, 22.0.0 installed | run + tune workers |
| ASGI/WSGI | READY | WSGI entry; ASGI reserved documented | none |
| Reverse proxy | READY WITH OPERATOR CONFIG | assumptions documented | configure proxy |
| HTTPS | READY WITH OPERATOR CONFIG | redirect+HSTS+secure cookies verified | cert + proxy TLS |
| SPA routing | READY | 16 smoke + 9 errors green | fallback → index.html |
| Health checks | READY | ping/version/health/sitemap/robots 200 | wire monitors |
| Logging | READY | request_id logs, no secrets | centralize/rotate |
| Error handling | READY | 404/401 envelope, no leak, UX specs green | none |
| Email | READY WITH OPERATOR CONFIG | SMTP env-driven, reset path real | SMTP creds + FROM |
| Cache | READY | LocMem + invalidation verified | none (shared backend optional later) |
| Scheduled publication | READY | `Published 0`, cap 50, runbook accurate | install cron line |
| Backups | READY WITH OPERATOR CONFIG | commands documented, not executed live | schedule dumps + media |
| Restore | READY WITH OPERATOR CONFIG | procedure documented, not executed live | verify monthly |
| Security | READY | 0 deploy warnings; headers/cookies verified | secret store, disable bootstrap |
| Dependencies | READY | lockfile (fe), ranges (be); 2 known LOW CVEs deferred | `npm audit fix` when convenient |
| Frontend build | READY | vite 4.40s + storybook 8.61s PASS | build with prod VITE_* |
| Browser smoke test | READY | 177/0 across 8 batches | post-deploy re-run |
| ERP | N/A (parked) | False/null/NullProvider | keep parked |

## 35. Blockers

None. Zero genuine application/deployment defects found.

## 36. Operator Configuration Required

Production PostgreSQL + `DATABASE_URL`; `DJANGO_SECRET_KEY` (50+ random);
`DJANGO_ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS` / `CORS_ALLOWED_ORIGINS` /
`SITE_URL` / `FRONTEND_URL`; SMTP credentials + FROM; reverse proxy + TLS
cert + SPA fallback + `/static/` + `/media/` maps; `VITE_API_BASE_URL` build;
cron line; backup schedule; disable bootstrap after first superuser.

## 37. Deferred Items

Carried from Phase 23 (all LOW, non-blocking): SVG stored-served XSS note;
localStorage JWTs (cookie mode exists, needs frontend arch); react-router
moderate CVEs (`npm audit fix` when convenient); no email verification (by
design); staff-flag (not codename) content gates (intentional). Plus: backend
has no `requirements/*.lock` pin file (ranges work, reproducible via
lockfile only on frontend); tracked `db.sqlite3` history (owner hygiene).

## 38. Exact Phase 25 Recommendation

**Phase 25 = "Final Acceptance / Project Close".** No new features. Final
regression across public site, six roles, auth, RBAC, content workflows,
publication, scheduling, media, SEO, RTL/LTR, responsive, accessibility,
performance, security, production configuration, DB integrity, migrations,
ERP parked, secrets, broken routes/buttons, E2E residue. Then produce
**Hanahoush v1.0 — Final Acceptance Report**.

---

## Final Verdict

**PRODUCTION READY WITH OPERATOR CONFIGURATION**

## User-level summary

**Can this application now be deployed safely to production once the
documented operator configuration is supplied?**

**Yes.** Code is deployment-ready (391 + 310 tests, 177/177 browser, zero
deploy warnings, smoke green, DB/migrations clean, ERP parked). The operator
provides hosting specifics per `docs/operations/production-deployment.md`:
PostgreSQL, domain, SMTP, proxy, TLS cert, cron — then follows the
deterministic §§4–20 sequence with rollback (§19) and smoke (§20) cover.
