import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios"

import { apiClient } from "@/shared/api/axiosClient"
import * as tokenStorage from "@/shared/api/tokenStorage"

function httpResponse(status: number, data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Unauthorized",
    headers: {},
    config,
  } as AxiosResponse
}

function httpError(status: number, config: InternalAxiosRequestConfig) {
  const error = new Error(`Request failed with status code ${status}`) as Error & {
    config?: unknown
    response?: unknown
  }
  error.config = config
  error.response = { data: {}, status, statusText: "Unauthorized", headers: {}, config }
  return error
}

describe("axios refresh interceptor", () => {
  const originalAdapter = apiClient.defaults.adapter

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it("retries a 401 request once after refreshing the access token", async () => {
    vi.spyOn(tokenStorage, "getAccessToken").mockReturnValue("old-access")
    vi.spyOn(tokenStorage, "getRefreshToken").mockReturnValue("old-refresh")
    const setTokensSpy = vi.spyOn(tokenStorage, "setTokens").mockImplementation(() => undefined)
    const clearTokensSpy = vi.spyOn(tokenStorage, "clearTokens").mockImplementation(() => undefined)

    const protectedCalls: number[] = []
    const refreshCalls: number[] = []

    const adapter: AxiosAdapter = async (config) => {
      if (config.url === "/api/v1/auth/refresh/") {
        refreshCalls.push(1)
        return httpResponse(
          200,
          { success: true, message: "", data: { access: "new-access", refresh: "new-refresh" }, errors: null },
          config,
        )
      }
      protectedCalls.push(1)
      if (protectedCalls.length === 1) {
        throw httpError(401, config)
      }
      return httpResponse(200, { success: true, message: "", data: { ok: true }, errors: null }, config)
    }
    apiClient.defaults.adapter = adapter

    const response = await apiClient.get("/protected")

    expect(protectedCalls.length).toBe(2) // original + one retry
    expect(refreshCalls.length).toBe(1) // exactly one refresh
    expect(setTokensSpy).toHaveBeenCalledWith("new-access", expect.any(String))
    expect(clearTokensSpy).not.toHaveBeenCalled()
    expect(response.data.data.ok).toBe(true)
  })

  it("clears tokens and emits an auth failure when the refresh fails", async () => {
    vi.spyOn(tokenStorage, "getAccessToken").mockReturnValue("old-access")
    vi.spyOn(tokenStorage, "getRefreshToken").mockReturnValue("old-refresh")
    const clearTokensSpy = vi.spyOn(tokenStorage, "clearTokens").mockImplementation(() => undefined)

    let authFailure = 0
    const { onAuthFailure } = await import("@/shared/api/axiosClient")
    const unsubscribe = onAuthFailure(() => {
      authFailure += 1
    })

    let protectedCalls = 0
    let refreshCalls = 0
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === "/api/v1/auth/refresh/") {
        refreshCalls += 1
        throw httpError(401, config) // refresh also fails
      }
      protectedCalls += 1
      throw httpError(401, config)
    }
    apiClient.defaults.adapter = adapter

    await expect(apiClient.get("/protected")).rejects.toBeTruthy()
    expect(protectedCalls).toBe(1) // no retry of the original request
    expect(refreshCalls).toBe(1) // exactly one refresh attempt
    expect(clearTokensSpy).toHaveBeenCalled()
    expect(authFailure).toBe(1)
    unsubscribe()
  })

  it("does not attempt refresh for the login endpoint", async () => {
    vi.spyOn(tokenStorage, "getRefreshToken").mockReturnValue("old-refresh")
    const refreshSpy = vi.fn()

    const adapter: AxiosAdapter = async (config) => {
      if (config.url === "/api/v1/auth/login/") {
        throw httpError(401, config)
      }
      refreshSpy()
      return httpResponse(200, { data: {} }, config)
    }
    apiClient.defaults.adapter = adapter

    await expect(
      apiClient.post("/api/v1/auth/login/", { username: "x", password: "y" }),
    ).rejects.toBeTruthy()
    expect(refreshSpy).not.toHaveBeenCalled()
  })
})
