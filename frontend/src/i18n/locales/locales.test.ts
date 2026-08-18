import { describe, expect, it } from "vitest"

import en from "./en/translation.json"
import fa from "./fa/translation.json"
import ar from "./ar/translation.json"

type Dict = Record<string, unknown>

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

/** Flatten a nested translation object into dotted key paths. */
function flatten(obj: Dict, prefix = ""): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flatten(value as Dict, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

/** Normalize plural-suffixed keys so _zero/_one/_few sets compare equal. */
function comparableKeys(locale: Dict): Set<string> {
  return new Set(flatten(locale).map((key) => key.replace(PLURAL_SUFFIX, "")))
}

function missingKeys(source: Dict, targetKeys: Set<string>): string[] {
  const keys = comparableKeys(source)
  return [...keys].filter((key) => !targetKeys.has(key)).sort()
}

describe("i18n locale parity", () => {
  const enKeys = comparableKeys(en)
  const faKeys = comparableKeys(fa)
  const arKeys = comparableKeys(ar)

  it("FA covers every EN key", () => {
    const missing = missingKeys(en, faKeys)
    expect(missing).toEqual([])
  })

  it("AR covers every EN key", () => {
    const missing = missingKeys(en, arKeys)
    expect(missing).toEqual([])
  })

  it("EN covers every FA key", () => {
    const missing = missingKeys(fa, enKeys)
    expect(missing).toEqual([])
  })

  it("EN covers every AR key", () => {
    const missing = missingKeys(ar, enKeys)
    expect(missing).toEqual([])
  })
})