import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import { onAuthFailure } from "@/shared/api/axiosClient"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/shared/api/tokenStorage"

import { fetchMe, login as loginRequest, logout as logoutRequest } from "../api/authApi"
import type { AuthStatus, LoginPayload, UserProfile } from "../types"

interface AuthContextValue {
  user: UserProfile | null
  status: AuthStatus
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<UserProfile>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setStatus("guest")
      return
    }
    try {
      const envelope = await fetchMe()
      setUser(envelope.data)
      setStatus("authenticated")
    } catch {
      // A failed /me without a refreshable token means the session is gone.
      setUser(null)
      setStatus("guest")
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  useEffect(() => {
    // Global session-expired signal from the axios refresh interceptor.
    return onAuthFailure(() => {
      setUser(null)
      setStatus("session-expired")
    })
  }, [])

  const login = useCallback(async (payload: LoginPayload): Promise<UserProfile> => {
    const envelope = await loginRequest(payload)
    const tokens = envelope.data
    setTokens(tokens.access, tokens.refresh)
    setUser(tokens.user)
    setStatus("authenticated")
    return tokens.user
  }, [])

  const logout = useCallback(async () => {
    try {
      // Best-effort: blacklist the refresh token server-side.
      const refresh = getRefreshToken()
      if (refresh) await logoutRequest(refresh)
    } catch {
      // Ignore network errors during logout.
    } finally {
      clearTokens()
      setUser(null)
      setStatus("guest")
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && Boolean(user),
      login,
      logout,
      refreshUser,
    }),
    [user, status, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
