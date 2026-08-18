# Hanahoush — UX Specification

> Full page-level UX specification. Every public and authenticated page is
> defined with purpose, audience, calls to action, content priority, states,
> SEO importance, animations and API dependencies.

---

## Page inventory

1. Home (`/`)
2. Services (`/services`)
3. Service detail (`/services/:slug`)
4. Projects (`/projects`)
5. Project detail (`/projects/:slug`)
6. Articles (`/articles`)
7. Article detail (`/articles/:slug`)
8. About (`/about`)
9. Contact (`/contact`)
10. Login (`/login`)
11. Forgot Password (`/forgot-password`)
12. Reset Password (`/reset-password`)
13. Dashboard (`/dashboard`)
14. Search results (`/search?q=`)
15. 404 (`/not-found` or `*`)
16. Privacy (`/privacy`)
17. Terms (`/terms`)

---

## 1. Home (`/`)

- **Purpose:** Convert visitors into inquiries and prove craft instantly.
- **Target user:** Enterprise CTO/IT decision makers; product owners; founders.
- **Primary CTA:** "Start a project" → `/contact`.
- **Secondary CTA:** "Explore services" → `/services`; "See hanRP" → anchor.
- **UX goals:** Establish premium positioning in the first viewport; communicate
  six service pillars; build trust via stats, projects, testimonials, partners.
- **Content priority:** Hero value → services → hanRP → proof (projects) →
  expertise (articles/technologies) → social proof → contact.
- **Loading state:** App shell + skeleton hero; sections reveal on scroll.
- **Empty state:** Not applicable (single page); fall back to a minimal
  "no content" placeholder per section if API data is absent.
- **Error state:** Section-level retry for API-driven blocks; page stays usable.
- **SEO importance:** Highest — primary landing, meta title/description,
  structured data (`Organization`, `Service`, `FAQPage`).
- **Animations:** Hero stagger, mouse glow, scroll reveals, card hover, counter
  animation on statistics, marquee for partners/technologies.
- **API dependency:** `services`, `projects` (featured), `articles` (recent),
  `testimonials`, `partners`, `technologies`, `faq`, `site-settings`.

## 2. Services (`/services`)

- **Purpose:** Explain the six offerings and help buyers self-classify.
- **Target user:** Evaluators comparing capabilities.
- **Primary CTA:** "Request a proposal" per service → `/contact`.
- **Secondary CTA:** "Explore case studies" → `/projects`.
- **UX goals:** Clear, scannable service cards with scope bullets.
- **Content priority:** Section groupings → service cards → detail.
- **Loading/Empty/Error:** Skeleton grid; empty → EmptyState + contact CTA;
  error → retry.
- **SEO importance:** High; per-service SEO titles/descriptions; `Service`
  schema.
- **Animations:** Card hover lift, icon micro-interaction, scroll stagger.
- **API dependency:** `services`, `servicesections`.

## 3. Service detail (`/services/:slug`)

- **Purpose:** Deep explanation, deliverables, and a strong proposal CTA.
- **Primary CTA:** "Get an estimate".
- **Secondary CTA:** Related articles + projects.
- **Content:** Hero (title/description), features, process, related work.
- **States:** Skeleton → empty (no service) → 404-like "not found" → error retry.
- **SEO importance:** High; long-tail keywords; canonical URL; breadcrumb.
- **Animations:** Content reveal, sticky CTA highlight on scroll.
- **API dependency:** `services/{slug}`.

## 4. Projects (`/projects`)

- **Purpose:** Portfolio proof — credible, outcome-focused case work.
- **Target user:** Decision makers validating delivery ability.
- **Primary CTA:** "Discuss a similar project" → `/contact`.
- **Secondary CTA:** Filter by category/technology.
- **UX goals:** Beautiful cards, filtering, fast scanning.
- **States:** Skeleton grid; empty → EmptyState; error → retry; pagination.
- **SEO importance:** Medium-high; category + technology index pages.
- **Animations:** Card reveal, image zoom on hover, filter transitions.
- **API dependency:** `projects?status=published&is_public=true` + filters.

## 5. Project detail (`/projects/:slug`)

- **Purpose:** Showcase a case study: challenge, solution, result.
- **Primary CTA:** "Start a project like this".
- **Content:** Hero, gallery, technologies, client, dates, live link.
- **States:** Skeleton → empty → error.
- **SEO importance:** Medium-high; structured `Project`/`Article` schema.
- **Animations:** Gallery lightbox, image reveal, tech chip pop.
- **API dependency:** `projects/{slug}`.

## 6. Articles (`/articles`)

- **Purpose:** Thought leadership + SEO traffic + credibility.
- **Target user:** Technical readers and researchers.
- **Primary CTA:** Read the article; secondary "Talk to us".
- **UX goals:** Clean list, category/tag filters, reading-time meta.
- **States:** Skeleton grid; empty → EmptyState; error → retry; pagination.
- **SEO importance:** High; the main organic-traffic engine.
- **Animations:** Card hover, staggered reveal.
- **API dependency:** `articles` list + filters.

## 7. Article detail (`/articles/:slug`)

- **Purpose:** In-depth reading with strong typography.
- **Primary CTA:** Author/footer "Work with us".
- **Content:** Hero (title, meta), rich body, tags, related articles, author.
- **States:** Skeleton → empty → error.
- **SEO importance:** Highest of the content pages; OpenGraph, breadcrumb.
- **Animations:** Reading progress bar, paragraph fade-in, table of contents
  scroll-spy.
- **API dependency:** `articles/{slug}`, related articles.

## 8. About (`/about`)

- **Purpose:** Humanize the company, share mission, team, timeline.
- **Primary CTA:** "Work with us" / "Join the team" (mail).
- **Secondary CTA:** Contact.
- **Content:** Hero, mission/vision, values, timeline, team, offices.
- **SEO importance:** Medium; `AboutPage` schema, E-E-A-T signals.
- **Animations:** Timeline scroll reveal, team card hover.
- **API dependency:** `about`, `teammembers`, `timeline`, `offices`.

## 9. Contact (`/contact`)

- **Purpose:** Lead capture.
- **Primary CTA:** Submit form (contact request).
- **Secondary CTA:** Email/phone/office links.
- **UX goals:** Short form, clear success, fast response expectation.
- **Loading/Empty/Error:** Button spinner; success state; field + network errors.
- **SEO importance:** Low-medium.
- **Animations:** Form focus transitions, success toast/check.
- **API dependency:** `contact-requests` (POST).

## 10. Login (`/login`)

- **Purpose:** Authenticate and reach `/dashboard`.
- **Primary CTA:** Sign in.
- **Secondary CTA:** Forgot password.
- **UX goals:** Minimal friction, clear validation, remember-me.
- **States:** Button loading; credential error; session-expired redirect.
- **SEO importance:** None (noindex).
- **Animations:** Card entrance, input focus.
- **API dependency:** `auth/login`, `auth/me`.

## 11. Forgot Password (`/forgot-password`)

- **Purpose:** Request a reset link.
- **Primary CTA:** Send reset link.
- **UX goals:** Privacy-safe, always-success messaging (no enumeration).
- **States:** Success message; validation errors.
- **SEO importance:** None.
- **API dependency:** `auth/password-reset`.

## 12. Reset Password (`/reset-password?uid=&token=`)

- **Purpose:** Set a new password with a token.
- **Primary CTA:** Reset password.
- **States:** Invalid-link state; success with redirect to login.
- **SEO importance:** None.
- **API dependency:** `auth/password-reset/confirm`.

## 13. Dashboard (`/dashboard`)

- **Purpose:** Authenticated hub for future client area.
- **Target user:** Logged-in company/clients; internal roles.
- **Primary CTA:** Depends on role (view reports, manage content).
- **UX goals:** Clear role-aware navigation, stats cards, quick actions.
- **States:** Auth loading; session-expired redirect; empty dashboards.
- **SEO importance:** None (noindex, requires auth).
- **Animations:** Card stagger, stat counter.
- **API dependency:** `auth/me`, role-scoped data endpoints.

## 14. Search results (`/search?q=`)

- **Purpose:** Global search across articles, projects, services.
- **Primary CTA:** Select a result; secondary refine query.
- **UX goals:** Fast, grouped results, highlight matched terms.
- **States:** Debounced loading; empty ("no results"); error → retry.
- **SEO importance:** Low (noindex).
- **Animations:** Result list stagger, skeleton.
- **API dependency:** `search?q=` (or per-resource `q` params).

## 15. 404 (`*`)

- **Purpose:** Recover lost visitors.
- **Primary CTA:** Back to home; secondary popular links.
- **UX goals:** On-brand, helpful, playful-but-premium.
- **Animations:** Subtle glyph motion.
- **SEO importance:** None.

## 16. Privacy (`/privacy`)

- **Purpose:** Legal compliance and trust.
- **Content:** Data collected, purposes, retention, rights, contact.
- **SEO importance:** Low.
- **API dependency:** none.

## 17. Terms (`/terms`)

- **Purpose:** Legal terms of service/use.
- **Content:** Scope, IP, liability, governing law.
- **SEO importance:** Low.

---

## Global UX principles

- **Clarity before cleverness** — every CTA states the outcome.
- **Proof over adjectives** — projects and numbers replace superlatives.
- **One primary action per screen.**
- **Motion is purposeful** — directional, ≤300 ms, never decorative noise.
- **Accessible by default** — keyboard, ARIA, contrast, reduced motion.
- **RTL/LTR first-class** — direction is a layout property, not a patch.
