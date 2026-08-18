# Hanahoush — Architecture Report (Phase 1, revision 2)

> Clean, scalable, production-grade scaffold for the Hanahoush platform.
> The future ERP integration module is codenamed **hanRP** and the design
> below keeps every decision compatible with it.

---

## 0. Stack confirmation

| Concern | Decision |
|---------|----------|
| Backend | **Django 5** + Django REST Framework + **PostgreSQL** — Django only. |
| Frontend | **React + Vite + TypeScript** — Node.js is used **only** as the build/development tool. |
| Containerization | **NOT used.** No Dockerfile, no docker-compose.yml, no container config. |
| Next.js / Node.js frameworks | **NOT used.** No Next.js, Express, NestJS or any Node server framework. |
| Web server (production) | Gunicorn (WSGI) for Django + static assets via Django/WhiteNoise. |
| Separation | Strict `backend/` and `frontend/` folders. |

---

## 1. Principles applied

| Principle | How it is enforced |
|-----------|--------------------|
| **Clean Architecture / Onion** | Every feature app splits into `domain` → `application` → `infrastructure` → `presentation`; dependencies point inward only. `common` is the shared kernel. |
| **SOLID** | Abstract repository ports (`BaseRepository`), injectable use cases (`BaseUseCase`), one responsibility per module, uniform response/error envelopes. |
| **Feature-based** | Code is grouped by domain (`apps.<feature>` / `src/features/<feature>`), not by technical role. |
| **12-factor** | All configuration/secrets come from environment variables (`django-environ`); one `.env` per environment. |
| **ERP (hanRP) ready** | Ports & adapters, request-ID correlation, soft-delete audit trail, versioned API contract, no cross-app imports. |

---

## 2. Final folder tree

```
hanahoush/
├── .gitignore
├── .editorconfig
├── README.md
└── ARCHITECTURE.md

backend/                                          # Django 5 + DRF (Python only)
│   ├── manage.py
│   ├── pyproject.toml                            # tooling: black, isort, ruff, pytest, coverage
│   ├── gunicorn.conf.py                          # production WSGI process config
│   ├── .env  ·  .env.example  ·  .gitignore
│   ├── config/
│   │   ├── settings/{base,local,production,ci}.py
│   │   ├── api/{__init__.py,v1.py}               # versioned namespace + Swagger wiring
│   │   ├── middleware/request_id.py              # X-Request-ID correlation
│   │   ├── urls.py  ·  wsgi.py  ·  asgi.py
│   │   ├── utils/
│   │   └── ws/                                   # ASGI/WebSocket reserved for hanRP events
│   ├── apps/
│   │   ├── common/                               # shared kernel (see §4)
│   │   └── user/                                 # reference feature scaffold (empty)
│   ├── requirements/{base,local,production,ci}.txt
│   ├── locale/                                   # Django i18n catalogs (en, fa)
│   └── scripts/{run_dev.sh,migrate.sh}

frontend/                                         # React + Vite + TypeScript
│   ├── package.json  ·  package-lock.json
│   ├── vite.config.ts  ·  vitest.config.ts
│   ├── tsconfig.json  ·  tsconfig.node.json
│   ├── tailwind.config.ts  ·  postcss.config.cjs
│   ├── eslint.config.mjs  ·  .prettierrc.json  ·  .prettierignore
│   ├── components.json                           # shadcn/ui config
│   ├── index.html
│   ├── .env  ·  .env.example  ·  .gitignore
│   ├── public/{robots.txt,manifest.webmanifest}
│   ├── src/
│   │   ├── main.tsx  ·  App.tsx  ·  vite-env.d.ts
│   │   ├── app/{providers,layouts,routes,theme}
│   │   ├── features/                             # NEW feature slices (phase 2)
│   │   ├── components/ui/                        # shadcn/ui output target
│   │   ├── shared/{api,constants,hooks,lib,types,utils}
│   │   ├── config/query.config.ts
│   │   ├── i18n/{config.ts,index.ts,locales/{en,fa}/translation.json}
│   │   └── styles/{globals.css,index.css}
│   └── tests/{unit,e2e,setup}
```

> **Not present:** any `Dockerfile`, `docker-compose.yml`, `.dockerignore`,
> `next.config.*`, `app/` (Next.js routing) or Node server code.

---

## 3. Backend packages — installed & reasons

| Package | Version | Reason |
|---------|---------|--------|
| `Django` | 5.2 LTS | Stable LTS web framework with ORM, auth-ready, async-capable, built-in i18n and security middleware. |
| `djangorestframework` | 3.15 | REST framework (serializers, viewsets, pagination, content negotiation). |
| `djangorestframework-simplejwt` | 5.x | Stateless JWT (access/refresh, rotation) — wired but not implemented yet. |
| `drf-spectacular` + `drf-spectacular-sidecar` | 0.27 | Auto-generated OpenAPI 3 schema + self-hosted Swagger UI & ReDoc. |
| `django-cors-headers` | 4.x | CORS + credentials handling for the Vite dev server origin. |
| `django-filter` | 24.x | Declarative filtering used by the DRF default filter backends. |
| `django-environ` | 0.14 | 12-factor env parsing (`db_url`, `bool`, `int`, `list`). |
| `psycopg[binary]` | 3.2 | PostgreSQL driver for Django. |
| `gunicorn` | 22 | Production WSGI server (workers, graceful restart) — no containers. |
| `whitenoise` | 6.7 | Serves collected static files in production alongside Gunicorn. |
| `django-extensions` | 3.x | Dev tooling (shell_plus, graph_models). |
| `django-debug-toolbar` | 4.x | Local SQL/performance inspection. |
| `pytest`, `pytest-django`, `pytest-cov`, `coverage`, `factory-boy` | — | Test runner, Django fixtures, coverage, factories. |
| `ruff`, `black` | — | Linter + formatter (configured in `pyproject.toml`). |

### Backend structure (`apps/common` — shared kernel)

- `domain/` — abstract entity, value object, repository port (`BaseRepository`), `BaseUnitOfWork`, domain exceptions. **No framework imports.**
- `application/` — `BaseUseCase`, `BaseDTO` (dependency-injected, testable).
- `infrastructure/` — Django `TimeStampedModel` / `SoftDeleteModel`, generic `DjangoRepository` (ORM adapter), signals, managers.
- `presentation/` — standard response envelope, unified exception handler, default pagination.

`apps/user/` is an empty feature scaffold showing exactly where models, use cases, repositories, serializers, views and urls will land in phase 2.

---

## 4. Frontend packages — installed & reasons

| Package | Version | Reason |
|---------|---------|--------|
| `react` / `react-dom` | 18.3 | UI runtime — chosen over Next.js; runs 100% client-side behind Vite. |
| `vite` | 5.4 | Build/dev tool (Node.js). No server framework — dev server only. |
| `typescript` | 5.6 | Strict static typing. |
| `tailwindcss` + `autoprefixer` + `tailwindcss-animate` | 3.4 | Utility CSS + animation plugin. |
| `@tanstack/react-query` | 5 | Server state (cache, retry, background refetch). |
| `react-router-dom` | 6.28 | Client-side routing (`createBrowserRouter`). |
| `axios` | 1.7 | Typed HTTP client with JWT-refresh interceptor. |
| `i18next` + `react-i18next` | 26 / 17 | Runtime multi-language (en/fa) with cookie persistence. |
| `framer-motion` | 11 | Declarative UI animations. |
| `gsap` | 3.12 | High-performance timeline/positional animations. |
| `clsx` + `tailwind-merge` | — | `cn()` class-composition utility used by shadcn/ui. |
| `vitest` + `@vitest/coverage-v8` | 2 | Unit tests + coverage. |
| `@testing-library/*` + `jsdom` | — | Component test harness (Node.js as test runner only). |
| `eslint` (9) + `typescript-eslint` + `@eslint/js` | — | Flat-config linting. |
| `prettier` + `prettier-plugin-tailwindcss` | — | Formatting + Tailwind class sorting. |

**shadcn/ui:** configured via `components.json` — outputs to `src/components/ui/`, imports `cn()` from `@/shared/lib`, `@/` alias wired in both Vite and tsconfig.

---

## 5. Removed packages / artifacts (revision 2)

| Removed | Reason |
|---------|--------|
| `docker-compose.yml` | No containers. |
| `backend/docker/` (Dockerfile, entrypoint.sh) | No containers. |
| `frontend/docker/` (Dockerfile, nginx.conf, templates) | No containers and no nginx reverse-proxy requirement. |
| `gunicorn.conf.py` under `docker/` | Replaced by `backend/gunicorn.conf.py` (plain process config). |
| `.vercel` ignore entry | Not using Vercel/Next.js deployment model. |
| Docker Compose env-var conventions | Replaced by direct PostgreSQL + env-file configuration. |

No packages were removed from the runtime dependency set — the frontend
dependency list is unchanged because it was never Next.js-based; the
backend dependency list is unchanged because it was already Django-only.

---

## 6. Architecture decisions

1. **Django-only backend.** No Node.js backend process; Django serves the REST API. Gunicorn + WhiteNoise handle WSGI + static in production.
2. **Ports-and-adapters in Django.** Abstract repository/unit-of-work ports live in `domain.interfaces`; ORM implementations in `infrastructure`. Swapping storage or splitting a domain into a microservice only changes the adapter.
3. **Versioned API** (`api/v1`) + OpenAPI contract → hanRP can integrate against a stable, machine-readable contract.
4. **Stateless JWT** (Bearer header + http-only refresh cookie) → no server session affinity, horizontal scaling without sticky sessions.
5. **Request-ID middleware** → `X-Request-ID` on every request/response for end-to-end correlation with ERP workers.
6. **Soft-delete & timestamps** base models → auditable data for ERP reconciliation.
7. **12-factor env-driven settings** (`base`/`local`/`production`/`ci`) → deployable on any server/PaaS with zero code changes.
8. **Stateless SPA** → the built `dist/` folder is served by any static host (Django, CDN, PaaS). No server-side rendering.
9. **Feature slices both sides** → a new domain adds one Django app + one `features/` folder; shared code stays untouched.

---

## 7. Future phases

| Phase | Scope |
|-------|-------|
| **Phase 2** | Custom `User` model (`AUTH_USER_MODEL`), authentication app (register/login/refresh), first real feature app + its migrations, real endpoints, frontend routes/pages and shadcn component set. |
| **Phase 3** | Business domains: organizations, products, inventory, sales — each as a Django app + frontend feature slice. |
| **Phase 4 — hanRP** | ERP integration module: async workers (Celery/Redis) for sync jobs, webhook/event endpoints, `ws/` websocket notifications, idempotency + outbox pattern on top of `BaseUnitOfWork`. |
| **Phase 5** | Observability: Sentry, structured JSON logs, APM; optional split of heavy domains into dedicated services (API contract unchanged). |

---

## 8. Verification (phase-1 scaffold, revision 2)

| Check | Command | Result |
|-------|---------|--------|
| Backend settings | `python manage.py check` (local/production/ci) | passed |
| Backend migrations | `python manage.py migrate` (sqlite fallback) | apps register & migrate |
| Backend syntax | `python -m py_compile` all `.py` | OK |
| Frontend types | `tsc --noEmit` | OK (strict) |
| Frontend lint | `eslint .` | no errors |
| Frontend tests | `vitest run` | passing |
| Frontend build | `vite build` | `dist/` emitted |

---

## 9. Explicit confirmations

- ✅ **Docker is NOT used.** There is no `Dockerfile`, no `docker-compose.yml`,
  no `.dockerignore`, and no container-related configuration anywhere in the
  project. Everything runs directly on the machine (Gunicorn for Django,
  Vite for the frontend).
- ✅ **Next.js is NOT used.** No `next.config.*`, no `app/`/`pages/` routing,
  no SSR. The frontend is plain **React + Vite + TypeScript**.
- ✅ **No Node.js backend.** Node.js appears only as the build/development
  tool for React/Vite (`npm run dev`, `vite build`, `vitest`). Express,
  NestJS and other Node server frameworks are absent.
- ✅ Backend is **Django only** (Django 5 + DRF + PostgreSQL).
- ✅ No business models, no APIs, no authentication, no pages were created
  (they are phase-2 scope).
