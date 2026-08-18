# Projects Page — `/projects`

The Projects portfolio is a **premium, editorial experience** — "here is what
we've actually built" — fully composed by the Page Builder from a `projects`
`Page` record (no hardcoded layout).

## Route

`/projects` → `ProjectsPage` = `usePage("projects")` + `<PageRenderer />`
+ `useScrollDepth("projects")` + `useSeoMeta`.

## Composed sections (in order)

| # | Section type | Source |
|---|---|---|
| 1 | `hero` | Page config — cinematic heading, supporting statement, animated background, living cursor, dual CTAs |
| 2 | `featured_projects` | CMS (`useFeaturedProjects`) — asymmetric editorial presentation (`FeaturedProjectCard`) |
| 3 | `project_filters` | CMS — category / technology / year / search / featured filtering (delegated to the API) + result grid |
| 4 | `technology_explorer` | CMS (`/projects/technologies/`) — discover projects by the actual technology data |
| 5 | `projects_timeline` | CMS — portfolio evolution grouped by real project years |
| 6 | `cta` | Page config |

Everything (copy, order, visibility, SEO) is authored in the Django admin
under **Page Builder → Pages → projects** and served by
`GET /api/v1/pages/projects/`.

## Filtering architecture

The discovery section uses `useProjectsFiltered(filters)` which maps the
domain filter object (`categoryId`, `technologySlug`, `year`, `q`,
`featuredOnly`, `pageSize`) onto the **existing project API** query params
(`category`, `technologies`, `year`, `q`, `is_featured`, `page_size`).
Filtering is server-side — no client-side filtering over large datasets.

Category and technology pickers are populated from the live API
(`/projects/categories/`, `/projects/technologies/`) — never hardcoded.

## Technology Explorer

`/projects/technologies/` returns every technology used by published
projects with a published-project count, ordered by usage. Selecting a chip
filters the explorer grid via the API (`technologies=<slug>`).

## Development

`/dev/projects` shows the project payload, active filters, query/cache state,
render analytics and the analytics event stream.
