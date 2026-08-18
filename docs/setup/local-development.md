# Hanahoush — Local Development Setup

> How to set up the Hanahoush backend and frontend on a local machine,
> including PostgreSQL user/database creation. The backend uses **PostgreSQL**
> only (no SQLite fallback for local development).

---

## 1. Prerequisites (versions used in this project)

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.12+ (this machine: 3.14.6) | See `backend/requirements/base.txt` |
| PostgreSQL | 16 | Service name `postgresql-x64-16`; psql at `C:\Program Files\PostgreSQL\16\bin\psql.exe` |
| Node.js | 20 LTS+ | Used only as the frontend build tool |
| npm | bundled with Node | |
| Git | any | Optional |

**Required packages (backend):** `Django>=5.2`, `djangorestframework`,
`psycopg[binary]`, `django-environ`, `djangorestframework-simplejwt`,
`drf-spectacular`, `django-filter`, `django-cors-headers`, plus admin packages
(`django-import-export`, `django-ckeditor-5`, `django-admin-sortable2`).
Install via `requirements/local.txt`.

**Frontend:** React, Vite, TypeScript, Tailwind, shadcn-style UI — install via
`npm install`.

---

## 2. Virtual environment (backend)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate         # Linux/macOS
pip install --upgrade pip
pip install -r requirements\local.txt
```

---

## 3. Create the PostgreSQL role and database

The app connects as user `hanahoush` to database `hanahoush` (see
`backend/.env` → `DATABASE_URL`). These must exist in PostgreSQL **before**
running migrations.

Open `psql` as the `postgres` superuser (you will be prompted for the password
set during PostgreSQL installation):

```powershell
# Windows: psql is not on PATH — use the full path
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 127.0.0.1 -d postgres
```

Then run (choose a strong password and keep it in sync with `.env`):

```sql
-- 1. Create the application role (LOGIN, password matching .env)
CREATE ROLE hanahoush WITH LOGIN PASSWORD 'hanahoush';

-- 2. Create the application database owned by that role
CREATE DATABASE hanahoush OWNER hanahoush;

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hanahoush TO hanahoush;

-- 4. PostgreSQL 15+: the public schema is owned by pg_database_owner, so the
--    database owner can already create tables. For extra safety:
GRANT ALL ON SCHEMA public TO hanahoush;
```

> Use a placeholder / non-default password and update `.env` accordingly —
> **do not commit real credentials.** If you already ran the above once, the
> `CREATE ROLE`/`CREATE DATABASE` statements error with `already exists`;
> that is fine (they are idempotent in effect).

---

## 4. Configure `.env`

Copy the template and adjust:

```powershell
cd backend
Copy-Item .env.example .env
```

Key values:

```dotenv
DJANGO_SETTINGS_MODULE=config.settings.local
DJANGO_SECRET_KEY=<a-long-random-string>
DJANGO_DEBUG=True
DATABASE_URL=postgres://hanahoush:<password>@localhost:5432/hanahoush
```

The `DATABASE_URL` user/password must match the role created in step 3.

---

## 5. Run migrations

```powershell
python manage.py migrate
```

If you get `password authentication failed for user "hanahoush"`, the role in
step 3 does not exist or its password differs from `.env` — run
`python manage.py doctor` to confirm, then re-check step 3.

---

## 6. Create a superuser

Two options:

```powershell
# Option A: manual
python manage.py createsuperuser

# Option B: automated provisioning (roles, permissions, demo users, superuser)
python manage.py bootstrap
```

`bootstrap` is idempotent and also creates the demo roles/users documented in
`docs/reports/phase-06.5-report.md`.

---

## 7. Run the backend

```powershell
python manage.py runserver
```

| URL | What |
|-----|------|
| http://localhost:8000/admin/ | Django admin |
| http://localhost:8000/api/docs/ | Swagger UI |
| http://localhost:8000/api/redoc/ | ReDoc |
| http://localhost:8000/api/health/ | Health check |

---

## 8. Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173 and talks to the backend through
`VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`).

---

## 9. Environment doctor

```powershell
python manage.py doctor
```

Checks Python, Django, `DATABASE_URL`, secret key, PostgreSQL connection,
media/static folders, migration status and optional Redis. Prints
PASS/FAIL/SKIP and exits non-zero on failure.

---

## 10. First-run (one command)

```powershell
python manage.py first_run
```

Runs `doctor` → `migrate` → `bootstrap` → `collectstatic` and prints a success
summary.
