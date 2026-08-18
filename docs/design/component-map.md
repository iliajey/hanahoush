# Hanahoush — Component Map

> Every reusable component, categorized, with a complexity estimate and where
> it is reused. Existing foundation components (Phase 5 `src/components/ui`)
> are marked **[exists]**; marketing/business components are **[planned]** for
> Phases 7C/7D/8.

---

## 1. Foundation primitives [exists — src/components/ui]

| Component | Category | Complexity | Reused in |
|-----------|----------|-----------|-----------|
| Button | Action | Low | Everywhere |
| Input / Textarea / Select | Form | Low | Forms, search |
| Checkbox / RadioGroup / Switch | Form | Low | Forms, filters |
| Label | Form | Low | Forms |
| Badge | Display | Low | Cards, filters |
| Avatar | Display | Low | Team, testimonials, profile |
| Alert | Feedback | Low | Errors, notices |
| Card + sub-parts | Display | Low | All content sections |
| Dialog / Modal | Overlay | Medium | Contact, auth, gallery |
| Tabs | Navigation | Medium | Service/dashboard |
| Accordion | Navigation | Medium | FAQ, mobile nav |
| Breadcrumb | Navigation | Low | Detail pages |
| Pagination | Navigation | Low | Lists |
| Spinner / Loading / Skeleton | Feedback | Low | Loading states |
| EmptyState / ErrorState | Feedback | Low | Lists, sections |
| Toast + ToastProvider | Feedback | Medium | Contact, auth, forms |
| ThemeToggle / LanguageToggle | Utility | Low | Header, home |
| DropdownMenu | Overlay | Medium | Profile menu, filters |

## 2. Marketing / landing components [planned]

| Component | Category | Complexity | Reused in |
|-----------|----------|-----------|-----------|
| Hero | Section | High | Home, detail heroes |
| SectionTitle | Section | Low | Every section |
| StatCounter | Display | Medium | Home statistics, dashboards |
| ServiceCard | Card | Medium | Home, services |
| ServiceSectionGroup | Section | Medium | Home services, services page |
| ERPShowcase | Section | High | Home ERP, hanRP |
| ProjectCard | Card | Medium | Home, projects, related |
| ProjectGallery | Display | High | Project detail |
| ArticleCard | Card | Medium | Home, articles, related |
| TechnologyMarquee | Display | Medium | Home, about |
| TestimonialCard | Card | Medium | Home, about |
| TestimonialCarousel | Section | High | Home |
| Timeline | Display | High | Home, about |
| PartnerLogo | Display | Low | Home, about |
| FAQItem / FAQList | Display | Medium | Home, about, contact |
| CTABand | Section | Low | Home, services, articles |
| ContactForm | Form | Medium | Contact, modals |
| SearchBar | Form | Medium | Header, search page |
| SearchResultsList | Display | Medium | Search page |
| FooterNav / FooterColumn | Navigation | Low | All pages |
| MegaMenu | Navigation | High | Desktop header |
| MobileDrawer | Navigation | Medium | Header (tablet/mobile) |
| StickyHeader | Navigation | Medium | All pages |
| BreadcrumbBar | Navigation | Low | Detail pages |
| ReadingProgress | Utility | Low | Article detail |
| TableOfContents | Navigation | Medium | Article detail |
| GalleryLightbox | Overlay | High | Project detail |
| AuthCard | Overlay | Medium | Login/register/forgot/reset |
| StatCard | Display | Medium | Dashboard |
| QuickActionTile | Display | Low | Dashboard |

## 3. Shared / cross-cutting

| Component | Category | Complexity | Reused in |
|-----------|----------|-----------|-----------|
| Grid | Layout | Low | All lists |
| Container / Section | Layout | Low | All pages |
| PageWrapper | Layout | Low | All inner pages |
| ProtectedRoute / GuestRoute | Routing | Low | Auth, dashboard |
| ProfileMenu / UserAvatar | Auth | Medium | Header, dashboard |
| PasswordInput / RememberMe | Form | Low | Auth forms |
| ErrorBoundary | System | Medium | Whole app |

## 4. Component count

- **Foundation primitives (exists):** ~25
- **Marketing/landing (planned):** ~28
- **Shared/cross-cutting:** ~11
- **Total reusable components:** ~64

## 5. Reuse rules

- Marketing components are composed from foundation primitives only.
- New components must ship with a Storybook story and RTL-safe classes.
- No business data in components — all content via props/API.
