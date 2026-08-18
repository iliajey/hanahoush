import "@testing-library/jest-dom"

// Minimal IntersectionObserver stub so framer-motion `whileInView` and the
// analytics visibility hook work under jsdom.
if (typeof window !== "undefined" && typeof window.IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    readonly root = null
    readonly rootMargin = ""
    readonly thresholds = []
    static instances: MockIntersectionObserver[] = []
    private callback: IntersectionObserverCallback
    private targets: Element[] = []

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      MockIntersectionObserver.instances.push(this)
    }

    observe(target: Element) {
      this.targets.push(target)
      queueMicrotask(() => {
        this.callback(
          this.targets.map((t) => ({ isIntersecting: true, target: t, intersectionRatio: 1 } as IntersectionObserverEntry)),
          this as unknown as IntersectionObserver,
        )
      })
    }

    unobserve(target: Element) {
      this.targets = this.targets.filter((t) => t !== target)
    }

    disconnect() {
      this.targets = []
    }

    takeRecords() {
      return []
    }
  }

  // Test-only global (IntelliSense: window type is widened at runtime).
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// Radix UI primitives (checkbox, select, dialog) rely on ResizeObserver.
if (typeof window !== "undefined" && typeof window.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
}
