import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"

import { AlertCircle } from "lucide-react"

interface SectionBoundaryProps {
  onError?: () => void
  children: ReactNode
}

interface SectionBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Per-section error boundary. A crash inside one section renders a local
 * fallback instead of unmounting the whole page.
 */
export class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageRenderer] section error:", error, info)
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm font-medium">This section failed to load.</p>
          <p className="max-w-md text-xs text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred while rendering this section."}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
