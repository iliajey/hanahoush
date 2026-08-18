/**
 * Analytics persistence (Phase 8H).
 *
 * Batches tracked events and ships them to the backend ingestion endpoint
 * (`POST /api/v1/analytics/events/`) using the Fetch API with `keepalive`, so
 * page requests and the UI loading state are never blocked or disturbed.
 *
 * Privacy rules (mirroring the backend model): no credentials are ever sent;
 * the payload is the event's own metadata plus a stable anonymous client id.
 *
 * The module is disabled in Vitest (`MODE === "test"`) so existing analytics
 * tests keep their pure in-memory behaviour.
 */
import i18n from "@/i18n"

export interface AnalyticsWireEvent {
  event_name: string
  timestamp: string
  session_key: string
  client_id: string
  locale: string
  path: string
  referrer: string
  metadata: Record<string, unknown>
}

const INGEST_URL = "/api/v1/analytics/events/"
const FLUSH_INTERVAL_MS = 5000
const MAX_PENDING = 100
const MAX_BATCH = 25

/** Metadata keys that are never allowed into persisted analytics. */
const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "pass",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "secret",
  "api_key",
  "apikey",
  "cookie",
  "session_id",
])

const CLIENT_ID_KEY = "hanahoush_client_id"
const sessionKey =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`

let enabled = import.meta.env.MODE !== "test"
const pending: AnalyticsWireEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function getClientId(): string {
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(CLIENT_ID_KEY, id)
    }
    return id
  } catch {
    return ""
  }
}

function currentPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : ""
}

function currentLocale(): string {
  return (i18n.language || "en").slice(0, 5)
}

/** Enable/disable persistence (used by tests and power users). */
export function setAnalyticsPersistenceEnabled(value: boolean): void {
  enabled = value
  if (!value && flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
}

export function isAnalyticsPersistenceEnabled(): boolean {
  return enabled
}

/** Strip credential-like keys from a metadata payload before queueing. */
function scrubMetadata(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (!SENSITIVE_METADATA_KEYS.has(key.toLowerCase().replace(/[^a-z0-9_]/g, ""))) {
      out[key] = value
    }
  }
  return out
}

/** Queue a tracked event for batched persistence (never throws). */
export function enqueueAnalyticsEvent(name: string, payload: Record<string, unknown>, at: number): void {
  if (!enabled) return
  pending.push({
    event_name: name,
    timestamp: new Date(at).toISOString(),
    session_key: sessionKey,
    client_id: getClientId(),
    locale: currentLocale(),
    path: currentPath(),
    referrer: typeof document !== "undefined" ? document.referrer.slice(0, 500) : "",
    metadata: scrubMetadata(payload ?? {}),
  })
  if (pending.length > MAX_PENDING) {
    pending.splice(0, pending.length - MAX_PENDING)
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flushAnalyticsEvents, FLUSH_INTERVAL_MS)
  }
}

/** Immediately flush pending events to the backend (fire-and-forget). */
export async function flushAnalyticsEvents(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  if (!enabled || pending.length === 0) return
  const batch = pending.splice(0, MAX_BATCH)

  try {
    await fetch(INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      credentials: "include",
      keepalive: true,
    })
  } catch {
    // Never throw or disturb the app; retried events are best-effort only.
  }
}

/** Flush remaining events on page unload (best-effort). */
if (typeof window !== "undefined" && enabled) {
  window.addEventListener("pagehide", () => {
    if (pending.length > 0) void flushAnalyticsEvents()
  })
}