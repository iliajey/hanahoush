import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** shadcn/ui utility: merge Tailwind classes, resolving conflicts. */
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}
