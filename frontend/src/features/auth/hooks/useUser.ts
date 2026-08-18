import { useAuth } from "./useAuth"
import type { AuthStatus, UserProfile } from "../types"

export interface UseUserResult {
  user: UserProfile | null
  status: AuthStatus
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

/** Access the current authenticated user. */
export function useUser(): UseUserResult {
  const { user, status, isAuthenticated, refreshUser } = useAuth()
  return { user, status, isAuthenticated, refreshUser }
}
