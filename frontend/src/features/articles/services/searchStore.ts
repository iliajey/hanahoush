import { useSyncExternalStore } from "react"

/** Tiny shared store: the hero search box writes, the discovery section reads. */

let query = ""
const listeners = new Set<() => void>()

export function setArticleSearchQuery(next: string): void {
  if (query === next) return
  query = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): string {
  return query
}

/** Reactive access to the shared article search query. */
export function useArticleSearchQuery(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}