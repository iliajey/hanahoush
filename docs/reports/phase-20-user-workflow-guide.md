# Hanahoush Staff Publishing Guide (Phase 20 — actual implemented workflow)

> No credentials, secrets, or tokens in this guide. Backend is authoritative; frontend only hides/disables.

## 1. Publish an Article

1. `Dashboard → Articles → New draft` (`/dashboard/articles/new`, needs `articles.update` + staff).
2. Pick editing language (FA/EN/AR dropdown). Fill title + slug + excerpt + body for each locale. Switch dropdown to complete all three; dots show completeness.
3. `Choose cover → Media library` (search/drag-drop/upload, select item, `Use this image`). Cover optional but health warns without it.
4. Fill SEO (meta title ≤70, description ≤160, canonical containing slug). Watch `Content health` + `SEO preview`.
5. `Create draft` (new) or `Save` (edit) → returns to `/dashboard/articles`. `Preview` link/button renders saved draft via public components; locale switcher FA/EN/AR; `Edit` returns to studio; public link appears only when `status=published`.
6. `Submit for review` (needs `editorial.manage`) → persists `review` then navigates to `/dashboard/editorial/:id`.
7. Approver (`editorial.approve`) decides in Editorial detail → stages advance `draft → in_review → seo_review → approved`.
8. Schedule (`editorial.schedule` or `manage`, stage `approved/scheduled`, datetime-local → `Schedule`) or `Publish now` (`editorial.manage`). Blockers render as 422 list; fix fields, retry. Success shows inline ✓ + toast + `Open timeline` link.
9. Verify: `/dashboard/timeline` row (countdown, retry/cancel), then public `/articles/:slug`.

## 2. Publish a Project

Same as Article with Project Studio 2.0 differences:

1. `Dashboard → Projects → New project` (`/dashboard/projects/new`).
2. Identity (title/slug per locale, client/location/dates/live URL), narrative body, then six case-study sections: Challenge / Objectives / Solution / Stages / Architecture / Results. Each section edits only the active locale; eye toggle hides a section (health warns).
3. Cover via MediaPicker; `Gallery` requires saving first (new items show `Save the project first`), then `Add image → MediaPicker`.
4. Health checks slug/titles/excerpts/bodies/cover/meta/case sections/gallery alt. Preview (`/dashboard/projects/:id/preview`) renders hero + body + all six sections + gallery with FA/EN/AR switcher.
5. Submit/schedule/publish identical to Article. Public proof: `/projects/:slug`.

## 3. Publish a Service

Services are **section-based, hub-only**. No `/services/:slug` route exists by decision (Option A).

1. `Dashboard → Services → New service` (`/dashboard/services/new`).
2. Identity (title/slug, section picker, icon key e.g. `code`, sort order), cover via MediaPicker, excerpt + body per locale.
3. Health warns on missing section. Preview (`/dashboard/services/:id/preview`) renders ServiceCard + body + hub breadcrumb.
4. Submit/schedule/publish identical. Public proof: `/services` hub (preview + workspace link to `/services`). Do not expect a detail URL.

## 4. Roles

| Role | Sees | Can do |
|---|---|---|
| SUPER_ADMIN | everything + Users | all incl. approve/publish/manage users |
| COMPANY_ADMIN | content + editorial + media + comms | manage+schedule+approve (no user admin) |
| CONTENT_MANAGER | articles + editorial + media + comms | articles write, editorial manage+schedule, review |
| PROJECT_MANAGER | articles + projects + editorial + media + contact | projects write, review (no articles write) |
| EDITOR | dashboard + editorial | review/comment only (no staff write, no media) |
| VIEWER | dashboard + editorial | read-only |

Forbidden routes → `/unauthorized`. Anonymous → `/login`. Backend 401/403 authoritative.

## 5. Draft → Review → Approval → Schedule → Publish

`draft → in_review → seo_review → approved → scheduled → published → archived`. Schedule rows stay `scheduled`; cron `publish_due()` flips to published when readiness passes; failures stay `scheduled` with `has_failed` + retry each tick. Cancelled never retries.

## 6. Upload media

MediaPicker dialog: search, `Upload` button/file input, drag-drop zone with progress %, grid select, trilingual metadata (title/alt/caption), Save, `Use this image`. Dialog is `max-h-[100dvh]` with internal scroll region + sticky footer (`Cancel` / `Use this image`) reachable at 375px, RTL/LTR, light/dark, keyboard (Tab/Enter/Esc, Radix trap).

## 7. Preview

Workspace row `Preview` (eye) or studio header `Preview`. Draft badge + status, locale switcher, Edit back-link, public link only when published. Read-only; nothing publishes from preview.

## 8. Fix health blockers

`Content health` lists critical (slug, per-locale title) vs warnings (excerpt, thin body <50w article/<30w service, cover, gallery alt, hidden sections). Click item → jumps + switches locale. SEO panel flags title/description/slug/canonical/og. Publishing 422 blockers list `LOCALE · message`; fix named field, retry.

## 9. Schedule

Approved stage → datetime-local → `Schedule`. Timeline shows countdown (`Publishes in Xm`, overdue badge). Reschedule/cancel inline (needs schedule perm). Failed rows show `Failed — fix & retry` + reason `role=alert`; fix content, reschedule or Publish now.

## 10. Failed publication

Stays `scheduled` + `has_failed`; dashboard Failed tile + attention queue + timeline attention bucket + toast on mutation failure. Retry: open studio, fix blockers, reschedule/publish. Success clears failure everywhere.

## 11. Verify public result

Article `/articles/:slug`, Project `/projects/:slug`, Service `/services` hub. Preview public link only when published. Timeline `Published` bucket + workflow audit confirm.

## 12. Localization

Studios edit one locale at a time; completeness dots per locale; `?locale=` deep link from timeline dots; preview switcher FA/EN/AR with EN fallback. Publish readiness checks all three locales server-side.

## 13. Button unavailable?

- No `New draft` → missing write perm (contact admin).
- No `Submit` → needs `editorial.manage`.
- No `Schedule/Publish` → stage not approved/scheduled, or missing schedule/manage perm (panel explains).
- `Publish now` silent → check blocked alert / actionError; fix and retry.

## 14. Common mistakes

- Saving then expecting instant public: must schedule/publish via Publication panel.
- Editing wrong locale: check dropdown; dots guide.
- Gallery before save: save project first.
- Expecting service detail URL: hub-only by design.
- Unsaved changes: dirty badge + `beforeunload`; 30s silent autosave on edits only.
