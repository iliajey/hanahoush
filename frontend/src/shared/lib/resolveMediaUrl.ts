/** Shared media-URL resolver (Phase 14 P0 fix).
 *
 * The API returns absolute URLs in production, but older rows, fixtures and
 * some transports may still carry relative `/media/...` paths. The SPA runs
 * on a different origin than the API in development (`:5173` vs `:8000`), so
 * a raw relative path would resolve against the frontend host and render as
 * a broken image. This helper joins relative paths onto the API origin
 * derived from `VITE_API_BASE_URL`, leaving absolute/http/data/blob URLs
 * untouched.
 */

function apiOrigin(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
  const match = base.match(/^(https?:\/\/[^/]+)/)
  if (match) return match[1]
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin
  return ""
}

/** Resolve any backend-supplied media path into a browser-loadable URL. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^(https?:\/\/|data:|blob:)/i.test(url)) return url
  const path = url.startsWith("/") ? url : `/${url}`
  const origin = apiOrigin()
  return origin ? `${origin}${path}` : path
}

/** Prefer preview_url, fall back to the raw file path, resolved for display. */
export function resolveMediaFile(file: { preview_url?: string | null; file?: string | null } | null | undefined): string | null {
  if (!file) return null
  return resolveMediaUrl(file.preview_url ?? file.file ?? null)
}
