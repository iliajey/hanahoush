import { forwardRef } from "react"
import type { HTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Constrain to the container max-width (max-w-7xl). */
  constrained?: boolean
}

/** Responsive content container with consistent horizontal padding. */
const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, constrained = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        constrained && "max-w-7xl",
        className,
      )}
      {...props}
    />
  ),
)
Container.displayName = "Container"

export { Container }
