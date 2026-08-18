# Hanahoush

> Enterprise platform — backend & frontend reference architecture.
> The name **hanRP** is reserved for the future ERP integration module.

A production-grade, **Clean Architecture** scaffold for a modern web platform
built on **Django 5 + Django REST Framework** (backend) and **React + Vite +
TypeScript** (frontend).

> **No Docker. No Next.js. No Node.js server framework.** Node.js is used
> exclusively as the build/development tool for the React/Vite frontend.
> The backend is Django only, talking to PostgreSQL directly.

---

## Repository layout

```
hanahoush/
├── backend/        Django 5 + DRF + PostgreSQL  (Python)
├── frontend/       React + Vite + TypeScript    (Node.js as a build tool only)
├── .editorconfig / .gitignore
├── README.md
└── ARCHITECTURE.md
```

The two tiers are **fully decoupled**: the backend exposes a versioned REST
API and the frontend consumes it over HTTP. Each can be developed, tested,
deployed and later migrated to a microservice independently.

---

## Quick start

### Backend (Django)

Prerequisites: Python 3.12+, PostgreSQL 16 (running locally).

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements/local.txt
cp .env.example .env                 # then edit DATABASE_URL
python manage.py migrate
python manage.py runserver
```

| URL | Description |
|-----|-------------|
| http://localhost:8000/api/docs/ | Swagger UI (drf-spectacular) |
| http://localhost:8000/api/redoc/ | ReDoc |
| http://localhost:8000/admin/ | Django admin |

### Frontend (React + Vite)

Prerequisites: Node.js 20 LTS+.

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

---

## Backend architecture

```
backend/
├── config/                       # Project wiring
│   ├── settings/               # base · local · production · ci
│   ├── api/v1.py               # Versioned URL namespace + Swagger wiring
│   ├── middleware/             # Request-ID correlation middleware
│   ├── utils/
│   └── ws/                     # ASGI / WebSocket (reserved for ERP events)
├── apps/
│   ├── common/                 # Shared kernel (entity/repository/serializer bases)
│   └── <feature>/              # per-domain app: domain · application · infra · presentation
├── requirements/               # base · local · production · ci
├── locale/                     # Django i18n translation catalogs (en, fa)
├── scripts/                    # helper scripts
└── manage.py
```

Every feature app follows **Clean Architecture**: Domain → Application →
Infrastructure → Presentation, with dependencies pointing **inward only**.

---

## Frontend architecture

```
frontend/
├── src/
│   ├── app/                    # Providers, routes, layouts, theme
│   ├── features/               # Feature slices (api · components · hooks · types · model)
│   ├── components/ui/          # shadcn/ui generated components
│   ├── shared/                 # UI primitives, API client, hooks, utils, i18n
│   ├── config/                 # Env / query constants
│   ├── i18n/                   # en · fa locale bundles
│   └── styles/
├── tests/                      # unit + e2e skeleton
├── public/
└── vite / tsconfig / eslint / prettier
```

---

## Documentation

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the complete design report
(folder tree, packages, reasons, decisions, future phases and the explicit
confirmation that Docker and Next.js are not used).
