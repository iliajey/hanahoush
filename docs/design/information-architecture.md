# Hanahoush — Information Architecture

> Complete sitemap, navigation hierarchy, URL strategy, internal linking,
> breadcrumbs and search design.

---

## 1. Complete sitemap

```
Home (/)
├── Services (/services)
│   └── Service detail (/services/:slug)
├── Projects (/projects)
│   ├── Project detail (/projects/:slug)
│   └── Filters: category, technology
├── Articles (/articles)
│   ├── Article detail (/articles/:slug)
│   ├── Category (/articles/category/:slug)
│   └── Tag (/articles/tag/:slug)
├── About (/about)
├── Contact (/contact)
├── Search (/search?q=)
├── Authentication
│   ├── Login (/login)
│   ├── Forgot password (/forgot-password)
│   └── Reset password (/reset-password)
├── Dashboard (/dashboard)            [protected]
├── 404 (catch-all *)
├── Privacy (/privacy)
└── Terms (/terms)
```

## 2. Navigation hierarchy

| Level | Items | Source |
|-------|-------|--------|
| Primary (header) | Home, Services, Projects, Articles, About, Contact | Static + content-driven |
| Services (mega menu) | Service sections → services | `ServiceSection` + `Service` |
| Secondary | Login / user menu, search, language, theme | Auth + settings |
| Footer | Company, Services, Resources, Legal, Contact | Static + dynamic |
| Breadcrumb | Home › Section › Item | Derived from URL |

## 3. URL hierarchy

- Clean, lowercase, hyphenated slugs (already Unicode-friendly for fa/ar).
- One canonical locale is the default (`/en`, `/fa`, `/ar` optional via prefix if
  full per-locale URLs are adopted; otherwise `Accept-Language` + `hreflang`).
- Resource URLs:
  - `/services/:slug`
  - `/projects/:slug`
  - `/articles/:slug`
  - `/articles/category/:slug`
  - `/articles/tag/:slug`
- Protected URLs: `/dashboard/*` require authentication; redirect to `/login`
  with a `from` parameter.

## 4. Internal linking strategy

- **Home → each pillar:** hero CTA → services; services → related projects;
  projects → contact.
- **Article → services:** in-body contextual links to relevant services.
- **Project → services:** every project links to the service(s) it demonstrates.
- **Service → proof:** each service shows related projects and articles.
- **Footer:** link hubs for crawlers (services, resources, legal).
- Every page links to at least one "next step" CTA to keep the funnel moving.

## 5. Breadcrumb strategy

- Shown on detail pages (`Services › Web Development`), hidden on home.
- Structure: `Home / {Section} / {Item}` using the existing `Breadcrumb`
  component; mirrors the URL; provides crawlable hierarchy.
- On mobile, breadcrumbs can collapse to "Back" + current title.

## 6. Search strategy

- Global search box in the header (desktop) and mobile menu.
- Searches articles, projects, services via the backend `q` parameter
  (multi-language fields: `title_*`, `description_*`, `slug`).
- Results grouped by type, debounced ≥300 ms, keyboard navigable.
- Empty query → do not navigate; empty results → EmptyState with suggestions.

## 7. Content model mapping

| IA node | Backend model(s) |
|---------|------------------|
| Services | `Service`, `ServiceSection` |
| Projects | `Project`, `ProjectCategory`, `Technology`, `ProjectImage` |
| Articles | `Article`, `Category`, `Tag` |
| About | `AboutPage`, `TeamMember`, `Timeline`, `Office`, `Partner` |
| Social proof | `Testimonial`, `Partner` |
| Company | `SiteSettings`, `SocialLink`, `Office`, `FAQ` |
| Contact | `ContactRequest` (POST), `Office`, `SiteSettings` |
| Auth/Dashboard | `accounts.User`, `Role`, `Permission`, auth API |
