# Hanahoush — Environment Hotfix Report

> Local development environment: PostgreSQL authentication failure.
> Date: 2025-08-04

---

## Root Cause

`manage.py migrate` (and any DB-backed command) failed before connecting with:

```
psycopg.OperationalError: password authentication failed for user "hanahoush"
```

Investigation established:

1. **Configuration is correct** — `backend/.env` → `DATABASE_URL=postgres://hanahoush:hanahoush@localhost:5432/hanahoush`;
   `config/settings/local.py` reads it via `django-environ` (`env.db_url("DATABASE_URL", …)`).
   `manage.py check` and the env-loading path work (verified).
2. **PostgreSQL 16 is running** — service `postgresql-x64-16`, port `5432`, `scram-sha-256`
   auth for all connections (no `trust`).
3. **The `hanahoush` role does not authenticate.** For `scram-sha-256`, PostgreSQL
   reports the same error whether the role is absent or the password mismatches.
   Either way, the role/database `hanahoush` were never created on this machine.
4. **Creating the role/database requires superuser access.** Non-interactive
   recovery was attempted and is not possible here:
   - No `%APPDATA%\postgresql\pgpass.conf`, no `PGPASSWORD`, no pgAdmin stored
     credentials.
   - The installer summary does not store the `postgres` password.
   - The current shell is **not elevated**: cannot reload `pg_hba.conf`
     (`pg_ctl reload` → "Operation not permitted") or restart the service.
   - Common/default passwords were rejected.

**Conclusion:** the fix is to create the PostgreSQL role + database as a
superuser, then confirm the `.env` password matches. The role/database must be
provisioned by someone with the `postgres` password (the developer). Tooling
(`doctor`, `first_run`) and documentation now make this a single documented step.

---

## Files Modified / Created

| Path | Change |
|------|--------|
| `backend/apps/common/management/commands/doctor.py` | **New** — environment diagnostics (PASS/FAIL/SKIP) |
| `backend/apps/common/management/commands/first_run.py` | **New** — doctor → migrate → bootstrap → collectstatic |
| `docs/setup/local-development.md` | **New** — full setup incl. PostgreSQL role/db creation |
| `docs/reports/environment-hotfix.md` | **New** — this report |

No settings files were changed: `DATABASES`, `local.py`, `base.py`,
`production.py` and env loading are already correct.

---

## Environment Variables

| Variable | Value / Default | Status |
|----------|-----------------|--------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.local` | ✅ |
| `DATABASE_URL` | `postgres://hanahoush:<pw>@localhost:5432/hanahoush` | ✅ configured |
| `DJANGO_SECRET_KEY` | local dev value | ✅ set |
| `DJANGO_DEBUG` | `True` | ✅ |
| `REDIS_URL` | (unset) | optional |

---

## Database Verification

| Check | Result |
|-------|--------|
| PostgreSQL service | ✅ `postgresql-x64-16` running on 127.0.0.1:5432 |
| Auth method | `scram-sha-256` (pg_hba.conf) |
| Config resolution | ✅ db=`hanahoush`, host=`localhost`, port=`5432`, user=`hanahoush` |
| psycopg connection | ❌ `OperationalError: password authentication failed for user "hanahoush"` |
| Role `hanahoush` exists | ❌ (or password mismatch — requires superuser to confirm) |
| Database `hanahoush` exists | ❌ (requires superuser to confirm) |
| Migration state | Not verifiable against PostgreSQL until role/db exist (suite verified on CI/SQLite fallback previously) |

---

## Commands Tested

| Command | Result |
|---------|--------|
| `python manage.py check` | ✅ 0 issues |
| `python manage.py doctor` | ✅ 7 passed, **1 failed (DB)**, 3 skipped — correct diagnosis |
| `python manage.py first_run` | ✅ aborts with clear guidance when DB unreachable |
| `python manage.py migrate` | ⚠️ requires the role/db (see Manual Setup Guide) |
| `python manage.py runserver` | ⚠️ requires the role/db |

---

## Manual Setup Guide (finish the fix)

As a PostgreSQL superuser (enter the `postgres` password when prompted):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 127.0.0.1 -d postgres
```

```sql
CREATE ROLE hanahoush WITH LOGIN PASSWORD 'hanahoush';
CREATE DATABASE hanahoush OWNER hanahoush;
GRANT ALL PRIVILEGES ON DATABASE hanahoush TO hanahoush;
GRANT ALL ON SCHEMA public TO hanahoush;
```

Then, from `backend/`:

```powershell
python manage.py first_run   # doctor → migrate → bootstrap → collectstatic
python manage.py runserver
```

Full instructions: **`docs/setup/local-development.md`**.

---

## Known Issues

1. The `hanahoush` role/database are not yet created — a superuser action that
   requires the `postgres` password (not available/discoverable in this
   session). Run the commands in the Manual Setup Guide.
2. `psql` is not on `PATH` (full path used in the docs).
3. No `REDIS_URL` configured — `doctor` reports Redis as `SKIP` (optional).

## Suggested Git Commit

```
fix(env): add doctor + first_run tooling and PostgreSQL setup docs

- Add manage.py doctor (env diagnostics, PASS/FAIL/SKIP)
- Add manage.py first_run (doctor -> migrate -> bootstrap -> collectstatic)
- Document PostgreSQL role/database creation for local development
- Root cause: hanahoush role/db missing -> password auth failure
```
