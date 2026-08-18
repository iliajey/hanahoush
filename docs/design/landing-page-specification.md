# Hanahoush — Landing Page Specification

> Complete Home Page design, section by section. This is a specification for
> Phase 7D implementation — not code.

---

## Section order

1. Hero
2. Statistics
3. Services
4. ERP (hanRP)
5. Projects
6. Articles
7. Technology Stack
8. Testimonials
9. Timeline
10. Partners
11. FAQ
12. Contact CTA
13. Footer

---

## 1. Hero

- **Purpose:** Establish premium positioning in under 5 seconds; direct the
  primary conversion.
- **Visual hierarchy:** Eyebrow badge → H1 (product-grade headline) → subcopy →
  dual CTAs → ambient product visual (right/end, RTL-aware).
- **Animations:** Staggered entrance (eyebrow → H1 → subcopy → CTAs → visual),
  mouse glow, subtle parallax on the visual, gradient orb drift.
- **Interaction:** Cursor glow follows pointer; the product mock tilts 1–2°
  toward the cursor; CTA hover states.
- **Content:** "Enterprise software, engineered like a product." + supporting
  line covering ERP (hanRP), Odoo, AI, web apps; primary CTA "Start a project",
  secondary "Explore services".

## 2. Statistics

- **Purpose:** Instant credibility via numbers (years, projects, engineers,
  uptime/satisfaction).
- **Visual hierarchy:** 4 large stat cards or a single band; numbers use
  display type; labels in muted text.
- **Animations:** Count-up on reveal (one pass), subtle fade.
- **Interaction:** Numbers count when scrolled into view.
- **Content:** Backed by real/admin-controlled figures (seeded or configured),
  e.g., years in business, delivered projects, team size, regions served.

## 3. Services

- **Purpose:** Communicate the six pillars and help buyers self-classify.
- **Visual hierarchy:** Section title → section groups → service cards
  (icon + title + scope bullets + link).
- **Animations:** Staggered card fade-up; icon micro-motion on hover; card lift.
- **Interaction:** Cards link to service detail; "Request a proposal" per card.
- **Content:** Enterprise Software, ERP (hanRP), Odoo, AI, Web Applications,
  Programming Services.

## 4. ERP (hanRP)

- **Purpose:** Differentiate Hanahoush with a named product, not just services.
- **Visual hierarchy:** Split layout — copy (features list) + product visual
  (dashboard mock); a "Learn about hanRP" CTA.
- **Animations:** Split-reveal; product mock parallax/tilt; feature rows fade.
- **Interaction:** Feature rows hover; CTA routes to contact or hanRP section.
- **Content:** What hanRP is, key modules (finance, inventory, procurement,
  HR), why it fits regional enterprises, integration with Odoo.

## 5. Projects

- **Purpose:** Proof of delivery; social proof by work.
- **Visual hierarchy:** Featured project (large) + grid of cards; category chips.
- **Animations:** Card reveal, image zoom on hover, chip transitions.
- **Interaction:** Click → project detail; filter chips filter client-side
  or via API.
- **Content:** 4–6 featured projects from `/projects` (published, featured),
  each with cover, title, client, tags.

## 6. Articles

- **Purpose:** Thought leadership + SEO + secondary trust.
- **Visual hierarchy:** 3 recent article cards (cover, title, meta).
- **Animations:** Card fade-up, hover lift.
- **Interaction:** Card → article detail; "View all articles" link.
- **Content:** Latest 3 published articles from `/articles`.

## 7. Technology Stack

- **Purpose:** Engineering depth signal.
- **Visual hierarchy:** Muted icon marquee or chip cloud (Django, React,
  PostgreSQL, Redis, Docker, Kubernetes, Odoo, AI/ML tools).
- **Animations:** Slow marquee (pause on hover); reduced-motion → static grid.
- **Interaction:** Hover highlights a chip.
- **Content:** Technologies from `/projects` + configured extras.

## 8. Testimonials

- **Purpose:** Human trust and outcomes.
- **Visual hierarchy:** Carousel/grid of quote cards (avatar, name, role,
  company, rating).
- **Animations:** Card fade/slide; auto-advance with pause-on-hover (optional).
- **Interaction:** Arrows + dots; keyboard accessible.
- **Content:** Featured testimonials from `/testimonials`.

## 9. Timeline

- **Purpose:** Story, longevity and milestones.
- **Visual hierarchy:** Vertical timeline (RTL-aware direction) with date + title
  + text; central line with alternating cards on desktop.
- **Animations:** Cards reveal from the timeline axis as they enter.
- **Interaction:** Hover highlights the node.
- **Content:** Milestones from `/timeline` (company history).

## 10. Partners

- **Purpose:** Affiliation/ecosystem trust.
- **Visual hierarchy:** Logo marquee or grid of partner logos (grayscale →
  color on hover).
- **Animations:** Slow marquee; fade on hover.
- **Interaction:** Links to partner sites (external).
- **Content:** Partners from `/partners`.

## 11. FAQ

- **Purpose:** Remove objections, improve SEO.
- **Visual hierarchy:** Two-column or accordion list of Q&A.
- **Animations:** Accordion expand/collapse (200 ms), chevron rotation.
- **Interaction:** Only one open at a time; `aria-expanded`; keyboard operable.
- **Content:** 6–8 FAQs from `/faq` (process, timeline, pricing, support,
  ERP migration).

## 12. Contact CTA

- **Purpose:** Final conversion gate.
- **Visual hierarchy:** Full-width gradient band or card with headline, subcopy
  and CTA buttons (form + email/phone).
- **Animations:** Band fade-up; button micro-interaction.
- **Interaction:** Primary → `/contact`; secondary → mailto/tel.
- **Content:** "Let's build something exceptional." + response-time promise.

## 13. Footer

- **Purpose:** Navigation hub, legal, contact, social.
- **Visual hierarchy:** Multi-column (Company, Services, Resources, Legal,
  Contact) + bottom bar (copyright, locale, social).
- **Animations:** None beyond default link hover.
- **Interaction:** Links; "Back to top" on long pages.
- **Content:** See `navigation-system.md` §6; uses `SiteSettings`, `SocialLink`,
  `Office`.
