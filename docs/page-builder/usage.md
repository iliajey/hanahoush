# Page Builder — Usage

How to author, compose and render pages dynamically.

## Authoring a page (Django admin)

1. **Admin → Page Builder → Pages → Add.**
   - English title is required; `slug` auto-generates from it (Unicode allowed).
   - Set status `Published` to make the page publicly reachable.
   - Tick **Home** to make it the landing page (singleton flag).

2. **Add sections** (drag-and-drop inline):
   - Choose a `section_type` from the registry (Hero, Statistics, Services,
     Projects, Articles, About, Team, Timeline, Partners, Testimonials, FAQ,
     CTA, ERP, Footer).
   - Toggle `is_enabled` to show/hide a section without deleting it.
   - Order rows by dragging — ordering is saved live.

3. **Configure each section** with the `config` JSON. Localized copy can be
   stored as nested objects so the API resolves per `Accept-Language`:
   ```json
   {
     "eyebrow": { "fa": "خدمات", "en": "Services", "ar": "الخدمات" },
     "title": { "fa": "خدمات ما.", "en": "Our services." },
     "page_size": 20
   }
   ```
   Optional per-locale overrides go in `language_overrides`:
   ```json
   { "en": { "title": "English-only title" } }
   ```

4. Save. The published page is immediately served by `/api/v1/pages/{slug}/`.
   The **live preview** link on the changelist opens the rendered page.

Every published change bumps `Page.version` and `version_at`.

## Serving the page

```
GET /api/v1/pages/home/        # composed page (seo + enabled, ordered sections)
GET /api/v1/pages/             # published page index
GET /api/v1/page-builder/      # section registry + pages (dev console)
```

Localize with the `Accept-Language` header (fa | en | ar). Draft pages are
never exposed.

## Rendering on the frontend

```tsx
import { usePage } from "@/features/page-builder"
import { PageRenderer } from "@/features/page-builder"

export function MyRoute({ slug }: { slug: string }) {
  const page = usePage(slug)
  if (page.isLoading) return <PageLoader />
  if (page.isError || !page.data) return <ErrorState />
  return <PageRenderer page={page.data} />
}
```

`<PageRenderer>` purely composes the page from its configuration — no layout
is hardcoded on the route.

## Chrome (navigation, footer, announcement)

- `useNavigation()` / `useFooter()` already drive the app Navbar/Footer.
- `AnnouncementBar` is mounted at the top of the app layout and reads the
  announcement endpoint (dismissible, time-boxed).
- `invalidatePageBuilderCache(queryClient)` clears page-builder caches after
  content edits.

## Dev console

`/dev/page-builder` (development only):
- Pick any published page.
- Inspect the **section order** and the registered section types.
- Watch **lazy loading** and **render analytics** (type, status, timing).