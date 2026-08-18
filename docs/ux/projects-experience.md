# Projects — UX Story

The portfolio must feel like **"here is what Hanahoush has actually built"** —
technical capability, engineering quality, business impact — not a card grid.

## Discovery narrative (listing)

```
I want to see what you've really shipped.
        │
        ▼
1 · HERO        "Projects that solved real challenges." (cinematic)
        │
        ▼
2 · FEATURED    Editorial, asymmetric presentations of the best work
        │         (large covers, story-first, not uniform cards)
        ▼
3 · DISCOVERY   Find by category, technology, year, keyword, featured
        │         (server-side filtering, honest counts)
        ▼
4 · EXPLORER    Or explore by the real technologies behind the work
        ▼
5 · TIMELINE    The portfolio's evolution over time
        ▼
6 · CTA         "Have a project in mind?"
```

## Case-study narrative (detail)

```
1 · HERO         what it is, when, which stack
2 · CHALLENGE    the problem, the constraints
3 · OBJECTIVES   what success looked like
4 · SOLUTION     the Hanahoush approach
5 · ARCHITECTURE here is how the system is actually built
6 · TECHNOLOGY   the real stack
7 · JOURNEY      how we delivered it (stages)
8 · GALLERY      it in pictures
9 · RESULTS      the outcome (qualitative, never invented)
10· RELATED      more to explore (projects + articles)
11· CTA          "Have a project in mind?" → contact
```

## Principles

- **CMS-only**: every project, case-study section and copy value comes from
  the API. No hardcoded portfolio content.
- **Honesty**: architecture renders only supplied nodes; results render only
  supplied outcomes; missing data degrades gracefully instead of being
  invented.
- **Editorial hierarchy**: asymmetric featured layouts, large covers, layered
  typography — preserved across M, L, XL screens (not a flat card stack).
- **Localization**: fa/en/ar copy via the existing multilingual architecture;
  RTL for fa/ar, LTR for en via `LanguageProvider`.

## Accessibility

- Gallery fully keyboard-driven (arrows + escape) with `role="dialog"`,
  labelled buttons, visible focus rings.
- Filters expose `aria-label`s; buttons report `aria-pressed`.
- Color is never the only signal (icons accompany CTA and comparison rows).
- Skeletons + `aria-busy` for lazy sections; reduced-motion-friendly.