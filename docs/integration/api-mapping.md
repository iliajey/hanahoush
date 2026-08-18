# Hanahoush — API Mapping (Frontend ↔ Backend)

Phase 8A connects every public CMS surface to the Django API. This document
maps each frontend React Query hook to its backend endpoint, serializer and
model.

All endpoints are mounted under `http://localhost:8000/api/v1/` and return
the standard Hanahoush envelope:

```json
{ "success": true, "message": "", "data": [...], "errors": null, "pagination": {...} }
```

## Language switching

Every CMS request sends the active locale as `Accept-Language: fa|en|ar`.
The backend resolves the computed localized fields (`title`, `description`,
`short_description`, `question`, `answer`, `content`, ...) from the request
language, falling back to English. Query keys include the locale so each
language is cached and refetched independently.

## Hook → Endpoint → Serializer → Model

### Articles
| Hook | Endpoint | Serializer | Model |
|---|---|---|---|
| `useArticles(params)` | `GET /articles/` | `ArticleListSerializer` | `apps.articles.Article` |
| `useFeaturedArticles(limit)` | `GET /articles/?is_featured=true` | `ArticleListSerializer` | `apps.articles.Article` |
| `useArticle(id)` | `GET /articles/{id}/` | `ArticleDetailSerializer` | `apps.articles.Article` |

### Projects
| Hook | Endpoint | Serializer | Model |
|---|---|---|---|
| `useProjects(params)` | `GET /projects/` | `ProjectListSerializer` | `apps.projects.Project` |
| `useFeaturedProjects(limit)` | `GET /projects/?is_featured=true` | `ProjectListSerializer` | `apps.projects.Project` |
| `useProject(id)` | `GET /projects/{id}/` | `ProjectDetailSerializer` | `apps.projects.Project` |

### Services
| Hook | Endpoint | Serializer | Model |
|---|---|---|---|
| `useServices(params)` | `GET /services/` | `ServiceListSerializer` | `apps.services.Service` |
| `useService(id)` | `GET /services/{id}/` | `ServiceDetailSerializer` | `apps.services.Service` |
| `useServiceSections()` | `GET /service-sections/` | `ServiceSectionSerializer` | `apps.services.ServiceSection` |

### Company content
| Hook | Endpoint | Serializer | Model |
|---|---|---|---|
| `useAbout()` | `GET /about/` | `AboutPageSerializer` | `apps.company.AboutPage` |
| `useTeam()` | `GET /team/` | `TeamMemberSerializer` | `apps.company.TeamMember` |
| `usePartners()` | `GET /partners/` | `PartnerSerializer` | `apps.company.Partner` |
| `useTestimonials(params)` | `GET /testimonials/` | `TestimonialSerializer` | `apps.company.Testimonial` |
| `useFAQs(params)` | `GET /faqs/` | `FAQSerializer` | `apps.company.FAQ` |
| `useTimeline()` | `GET /timeline/` | `TimelineSerializer` | `apps.company.Timeline` |
| `useSocialLinks()` | `GET /social-links/` | `SocialLinkSerializer` | `apps.company.SocialLink` |
| `useOffices()` | `GET /offices/` | `OfficeSerializer` | `apps.company.Office` |

### Site surfaces
| Hook | Endpoint | Serializer / View | Model(s) |
|---|---|---|---|
| `useSiteSettings()` | `GET /site-settings/` | `SiteSettingsSerializer` | `apps.company.SiteSettings` (singleton) |
| `useNavigation()` | `GET /navigation/` | `navigation_view` (derived) | `SiteSettings` + published content + server label map |
| `useFooter()` | `GET /footer/` | `footer_view` (derived) | `SiteSettings`, `SocialLink`, published `Service` |

> Navigation and footer have no dedicated database tables (the site IA is
> stable). The API serves them as first-class surfaces built from persisted
> data plus server-managed localized labels — the frontend never hardcodes
> them.

## Pagination, filtering, ordering, search

The v1 API supports all four across list endpoints:

| Feature | Query params | Example |
|---|---|---|
| Pagination | `page`, `page_size` | `/articles/?page=2&page_size=10` |
| Filtering | model-specific (`is_featured`, `category`, `section`, `status`, ...) | `/projects/?is_featured=true` |
| Ordering | `ordering` | `/articles/?ordering=-published_at` |
| Searching | `q` | `/faqs/?q=ERP` |

The frontend encodes these through `ListParams` (`page`, `pageSize`,
`ordering`, `q`, ...) in `src/features/cms/types` and forwards them via
`buildListParams()` in `src/features/cms/api/client.ts`.

## Publishing lifecycle

- Unauthenticated/public views only ever see `status=published` +
  `is_public=True` (enforced in `PublishableViewSet.get_queryset`).
- Draft / review / archived records are never exposed to the public API —
  verified by backend tests (`test_draft_never_visible`).

## Cache strategy (frontend)

Global policy lives in `src/features/cms/cache/strategy.ts`:

| Tier | staleTime | Applied to |
|---|---|---|
| `site` | 30 min | site-settings, navigation, footer |
| `content` | 5 min | about, team, timeline, services, service-sections |
| `listings` | 2 min | articles, projects, testimonials, partners, FAQs |

- `gcTime` 10 min, `retry` 2 with exponential backoff, `refetchOnReconnect`.
- Requests are deduplicated by React Query query-key hashing + structural
  sharing (concurrent subscribers share one in-flight request).
- Prefetch: `prefetchHomeContent(queryClient, locale)` warms every landing
  page query ahead of navigation.
- Invalidation: `invalidateCmsCache(queryClient, locale?)`.

## Dev console

`/dev/api` (development only) lists every endpoint with its hooks, exposes
per-request timing, the current React Query cache state and per-query
status/fetch state.
