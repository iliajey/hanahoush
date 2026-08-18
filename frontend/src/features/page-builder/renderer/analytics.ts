import { useEffect, useState } from "react"

import type { SectionRenderRecord } from "../types"

/** Section render analytics — module-level store observable by the dev page. */

let nextId = 1
const records: SectionRenderRecord[] = []
const listeners = new Set<() => void>()
const MAX_RECORDS = 200

function emit() {
  listeners.forEach((listener) => listener())
}

export function recordSectionRender(record: Omit<SectionRenderRecord, "id">): void {
  records.unshift({ id: nextId++, ...record })
  if (records.length > MAX_RECORDS) records.length = MAX_RECORDS
  emit()
}

export function getSectionRenderRecords(): SectionRenderRecord[] {
  return records
}

export function clearSectionRenderRecords(): void {
  records.length = 0
  emit()
}

/** Reactive subscription to the section render records. */
export function useSectionRenderRecords(): SectionRenderRecord[] {
  const [state, setState] = useState<SectionRenderRecord[]>(getSectionRenderRecords)
  useEffect(() => {
    const update = () => setState(getSectionRenderRecords())
    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [])
  return state
}
