# Hanahoush — Navigation System

> Desktop, tablet and mobile navigation; mega menu; sticky header; footer and
> scroll behavior.

---

## 1. Desktop navigation (≥1024px)

- Horizontal top bar: logo (left/start) → primary links → utilities
  (search, language toggle, theme toggle, auth CTA) → login/user menu (end).
- Primary links: **Services, Projects, Articles, About, Contact**.
- "Services" opens a **mega menu** (see §4). Other links are simple.
- `Home` is reached via the logo.
- Keyboard: arrow keys move within the mega menu; `Esc` closes; focus trap.

## 2. Tablet navigation (768–1023px)

- Compact top bar: logo + utilities (search, language, theme) + hamburger.
- Primary links move into the hamburger drawer (slide-in panel).
- Mega menu degrades to an accordion inside the drawer.

## 3. Mobile navigation (<768px)

- Top bar: logo + language/theme + hamburger.
- Drawer from the side (respects RTL: slides from the end), full height,
  overlay + scroll lock.
- Primary links stacked; Services expands as an accordion of sections;
  auth CTA prominent at the bottom.
- Close on route change and on `Esc`; `aria-expanded` managed.

## 4. Mega menu (desktop)

- Trigger: "Services" hover/focus/click.
- Two-column panel: service **sections** (left) → their **services** (right);
  a featured service card or CTA card at the far end.
- Data-driven from `ServiceSection` + `Service`.
- Behavior: 120 ms fade + 8 px rise; closes on outside click, `Esc`, route change.
- Accessibility: `aria-haspopup="menu"`, roving focus, `aria-expanded`.

## 5. Sticky header

- Header sticks after scrolling 8px; gains a translucent blurred surface
  (`bg-background/80 backdrop-blur`) and a hairline bottom border.
- On scroll-down the header can shrink (compact) or hide-then-reveal on
  scroll-up for reading pages (optional, prefers-reduced-motion respected).

## 6. Footer navigation

- Multi-column:
  - **Company** — About, Contact, Projects, Careers/join.
  - **Services** — each service link (dynamic).
  - **Resources** — Articles, Technology stack, FAQ.
  - **Legal** — Privacy, Terms.
  - **Contact block** — email, phone, offices, social links (`SocialLink`).
- A "Back to top" control on long pages.

## 7. Scroll behavior

- `scroll-behavior: smooth` for same-page anchors (e.g., hero → section).
- Section anchors used for home sections (`#services`, `#erp`, `#projects`…).
- Scroll spy highlights the active section in the sticky nav (desktop).
- Reading pages (articles) show a thin progress indicator.
- Scroll-driven reveals use IntersectionObserver; disabled under
  `prefers-reduced-motion`.

## 8. Breadcrumbs

- Detail pages only; collapse to "Back" on narrow viewports.
- See `information-architecture.md` §5.

## 9. Navigation state summary

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Primary links | Inline | Drawer | Drawer |
| Mega menu | Hover/click panel | Accordion | Accordion |
| Search | Inline field | Icon → overlay | Drawer item |
| Auth | Login + user menu | Login + user menu | Drawer CTA |
| Language/Theme | Inline toggles | Inline toggles | Drawer items |
