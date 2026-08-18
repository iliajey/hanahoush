import { useEffect, useId } from "react"

/**
 * Injects a JSON-LD structured-data block into <head>.
 * Renders nothing; rebuilds the tag for every new snapshot (id-stable).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const id = useId()
  useEffect(() => {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = `jsonld-${id}`
    script.text = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [data, id])
  return null
}