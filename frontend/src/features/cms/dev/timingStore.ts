/** Dev-only request timing store for the /dev/api page. */

export interface CmsRequestTiming {
  id: number
  method: string
  path: string
  startedAt: number
  durationMs: number
  status: number | null
}

let nextId = 1
const timings: CmsRequestTiming[] = []
const MAX_ENTRIES = 60

export function recordTiming(input: Omit<CmsRequestTiming, "id">): void {
  timings.unshift({ id: nextId++, ...input })
  if (timings.length > MAX_ENTRIES) timings.length = MAX_ENTRIES
}

export function getCmsTimings(): CmsRequestTiming[] {
  return timings
}

export function clearCmsTimings(): void {
  timings.length = 0
}
