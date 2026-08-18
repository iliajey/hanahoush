/**
 * Token storage — AUTHENTICATION STRUCTURE ONLY.
 *
 * No login/logout logic lives here; this module only knows how to persist
 * and read JWT access/refresh tokens. Real authentication flows land in a
 * later phase. The API client reads tokens through these helpers.
 */

const ACCESS_TOKEN_KEY = "hanahoush_access_token"
const REFRESH_TOKEN_KEY = "hanahoush_refresh_token"

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } catch {
    /* ignore storage errors */
  }
}

export function clearTokens(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    /* ignore storage errors */
  }
}
