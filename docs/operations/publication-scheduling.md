# Publication Scheduling — Production Runbook (Phase 18, re-verified Phase 21)

> Phase 18: batch cap (`PUBLISH_DUE_BATCH_SIZE = 50`, oldest-due first),
> unresolved-failure semantics (a `publish.failed` clears on the next
> `workflow.publish`), dashboard `failed_count`/`failed` surfacing, timeline
> `?bucket=attention` + `has_failed` payload. No job queue — cron remains
> the scheduler.

Command: `python manage.py publish_scheduled` (Django, from `backend/`).

## What it does

Publishes `PublicationSchedule` rows with `status=scheduled` and
`scheduled_for <= now()`. Idempotent: safe to run repeatedly. Each run:

- publishes due items via `ScheduleService.publish_due()` → `WorkflowService.publish()`
- skips future + cancelled schedules (query filters `status=scheduled` only)
- skips already-public content (marks schedule `published`, no republish)
- refuses content with BLOCKING health issues (missing slug/title/body,
  invalid slug/canonical) and records a `publish.failed` audit event
- records `workflow.publish` audit per published item
- clears dashboard ops cache; sitemap invalidates via model signals
- one failed item never blocks others (per-item try/except, warning log)

## Frequency / timezone

- Recommended: cron every 1–5 min: `*/2 * * * * /srv/hanahoush/backend/venv/bin/python /srv/hanahoush/backend/manage.py publish_scheduled >> /var/log/hanahoush/publish.log 2>&1`
- Timezone-safe: `scheduled_for` stored UTC; comparison uses `django.utils.timezone.now()`. DST-safe.
- Overlap-safe: no lock needed — second run finds `status=published` and publishes 0 items.

## Retry behavior (final, Phase 18)

- Failed rows stay `scheduled` and retry each tick **by design** — never
  silently dropped. Retries are safe: idempotent publish, per-item isolation,
  already-public skip, cancelled never re-run.
- A failure is *unresolved* until the next `workflow.publish` for the same
  workflow; fixing content and retrying (cron or manual publish) clears the
  actionable state (dashboard `failed_count`, timeline `has_failed` badge).
- Each tick processes at most 50 rows (oldest-due first); leftovers retry
  next tick. No infinite destructive loop: failures only warn-log + audit.

## Logging / monitoring

- Success prints `Published N scheduled item(s).`
- Failures log `WARNING Scheduled publish {blocked|failed} for <id>: <reason>` (no secrets, no stack traces).
- Monitor: alert if `publish.failed` audit events spike, or if `status=scheduled AND scheduled_for < now() - 15min` rows persist.
- Operator views: dashboard `Publication operations → Failed` card +
  Attention queue entry; timeline `?bucket=attention` + `Failed — fix & retry`
  badge with last-failure reason on the row.

## Manual recovery / testing

- Dry check: `manage.py shell -c "from apps.editorial.models import PublicationSchedule; print(PublicationSchedule.objects.filter(status='scheduled').count())"`
- Safe test: schedule test content 5 min out, run command, verify publish + audit, delete test content.
- Retry a blocked item: fix title/body/slug/canonical in studio, then either wait for next cron tick or publish manually from PublicationPanel.
- Disable: comment out the cron line (`crontab -e`). No code change needed.

## What NOT to do

- Do NOT add Celery/Redis/beat for this — cron is sufficient at current volume.
- Do NOT run with `--force` flags (none exist); do NOT reset/delete schedules directly in DB.
- Do NOT schedule content with blocking issues expecting cron to publish it — the gate refuses on purpose.
