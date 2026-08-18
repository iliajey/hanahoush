/** Auth feature utilities. */
import type { ApiError } from "@/shared/types/api"

/** Extract a user-friendly message from a normalized API error. */
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message)
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}

/** Format a "full name" from profile fields, falling back to username. */
export function getDisplayName(
  profile: { first_name?: string; last_name?: string; username?: string } | null | undefined,
): string {
  if (!profile) return "User"
  const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
  return full || profile.username || "User"
}

/** Extract the user's initials for the avatar fallback. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
