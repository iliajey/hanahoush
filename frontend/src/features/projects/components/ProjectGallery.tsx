import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"
import { projectAnalytics } from "@/features/projects/services/analytics"

interface GalleryImage {
  src: string
  alt: string
  caption?: string
}

/** Premium project gallery with fullscreen lightbox + keyboard navigation. */
export function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null)

const close = useCallback(() => setOpen(null), [])
  const moveBy = useCallback((current: number | null, delta: number) => {
    if (current === null) return null
    return (current + delta + images.length) % images.length
  }, [images.length])

  useEffect(() => {
    if (open === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return close()
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const next = moveBy(open, event.key === "ArrowRight" ? 1 : -1)
        if (next === null) return
        projectAnalytics.galleryImage(next)
        setOpen(next)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close, moveBy])

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No gallery images for this project yet.
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, i) => (
          <button
            key={image.src + i}
            type="button"
            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted focus-visible:outline-2 focus-visible:outline-brand-500"
            onClick={() => {
              projectAnalytics.galleryOpen()
              setOpen(i)
            }}
            aria-label={`Open image ${i + 1}: ${image.alt}`}
          >
            <ResponsiveImage src={image.src} alt={image.alt} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {open !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project gallery lightbox"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <div className="flex w-full max-w-4xl items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => {
                const next = moveBy(open, -1)
                if (next !== null) {
                  projectAnalytics.galleryImage(next)
                  setOpen(next)
                }
              }}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <ResponsiveImage src={images[open].src} alt={images[open].alt} className="max-h-[70vh] w-full rounded-xl object-contain" />
            </div>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => {
                const next = moveBy(open, 1)
                if (next !== null) {
                  projectAnalytics.galleryImage(next)
                  setOpen(next)
                }
              }}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Close gallery"
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="mt-4 max-w-xl text-center text-sm text-white/80">{images[open].caption || images[open].alt}</p>
        </div>
      ) : null}
    </div>
  )
}