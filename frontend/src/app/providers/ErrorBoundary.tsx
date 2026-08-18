import { Component, type ErrorInfo, type ReactNode } from "react"

import i18n from "../../i18n"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary.
 *
 * Catches render-time errors below it and renders a fallback instead of
 * unmounting the whole app. The default fallback is a plain, theme-aware,
 * localized error state with a retry — technical error details are logged for
 * developers but never shown to users.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Hanahoush] Error boundary caught:", error, info)
    this.props.onError?.(error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          role="alert"
          className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div className="text-4xl" aria-hidden="true">
            ⚠️
          </div>
          <h2 className="text-xl font-semibold">{i18n.t("errors.unexpected")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{i18n.t("errors.sectionDescription")}</p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {i18n.t("errors.retry")}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
