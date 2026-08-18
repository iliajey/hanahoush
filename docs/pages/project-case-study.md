# Project Case Study — `/projects/:slug`

Each project detail is a full **Case Study**, assembled as a page and rendered
by the existing `<PageRenderer />`. It reuses the section registry, lazy
loading, per-section error boundaries and the unknown-section fallback.

## Assembly

`ProjectCaseStudyPage`:
1. `useProjectBySlug(slug)` → the case-study payload
   (`GET /api/v1/projects/by-slug/{slug}/`, draft-protected, localized).
2. `buildCaseStudyPage(slug, meta)` builds a Page-shaped object whose sections
   carry `config.projectSlug`.
3. `<PageRenderer page={page} />` renders the case sections from the registry.

## Case-study sections

| # | Section type | Content |
|---|---|---|
| 1 | `case_hero` | title, category, year, featured badge, short description, technologies, cover (subtle motion) |
| 2 | `case_challenge` | problem, who had it, constraints (`case_study.challenge`) |
| 3 | `case_objectives` | goals (`case_study.objectives`) |
| 4 | `case_solution` | the Hanahoush approach (`case_study.solution_approach`) |
| 5 | `case_architecture` | **ArchitectureViewer** — layered visualization driven by `case_study.architecture`; graceful fallback when absent |
| 6 | `case_technology` | real project technologies (chips/cards from backend data) |
| 7 | `case_journey` | implementation stages (`case_study.implementation_stages`) |
| 8 | `case_gallery` | **ProjectGallery** — multiple images, fullscreen lightbox, keyboard navigation, captions, lazy images (existing MediaFile/ProjectImage) |
| 9 | `case_results` | **ProjectResults** — outcomes from `case_study.results`; never invents metrics; omits gracefully |
| 10 | `case_related_projects` | backend-computed by category/technology overlap (`related_projects`) |
| 11 | `case_related_articles` | backend-computed related articles (`related_articles` by technology-tag overlap) |
| 12 | `case_cta` | "Have a project in mind?" → contact |

## Structured case-study content

`Project.case_study` is a single JSONField holding the structured sections
(`challenge`, `objectives`, `solution_approach`, `architecture`,
`implementation_stages`, `results`). Values may be localized objects
(`{fa, en, ar}`) resolved by the API via `Accept-Language`. The field is
authored in the admin (Readonly JSON) and edited by the editorial workflow.
No HTML blobs; no invented metrics.

## Editorial integration

Projects are editorial content. The public API only exposes
`status=published, is_public=True` (draft protection); unpublished/archived
projects never appear publicly; the by-slug action uses the same published
queryset. The Phase 8C workflow governs the project lifecycle.

See `docs/ux/projects-experience.md` and `docs/architecture/project-case-study.md`.