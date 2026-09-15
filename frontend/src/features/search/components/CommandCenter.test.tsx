import { describe, expect, it, vi, beforeEach } from "vitest"
import { fireEvent, screen, waitFor, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import type { ReactNode } from "react"

import LanguageProvider from "@/app/language/LanguageProvider"
import ThemeProvider from "@/app/theme/ThemeProvider"
import { AuthContext } from "@/features/auth/services/AuthProvider"
import i18n from "@/i18n"
import { SearchCommand } from "@/features/search/components/SearchCommand"
import { commandsForUser, filterCommands } from "@/features/search/components/commands"
import { PERMISSIONS } from "@/features/auth/permissions"
import * as SearchApi from "@/features/search/api"

vi.mock("@/features/search/api", async (importOriginal) => {
  const original = await importOriginal<typeof SearchApi>()
  return { ...original, fetchSearch: vi.fn() }
})

vi.mock("@/features/auth/hooks/useUser", () => ({
  useUser: () => ({
    user: { id: 1, username: "boss", is_staff: true, is_superuser: true, role: { codename: "SUPER_ADMIN" }, permissions: [] },
    status: "authenticated",
    isAuthenticated: true,
    refreshUser: async () => undefined,
  }),
}))

const mockFetchSearch = vi.mocked(SearchApi.fetchSearch)

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const authValue = {
    user: { id: 1, username: "boss", is_staff: true, is_superuser: true, role: { codename: "SUPER_ADMIN" }, permissions: Object.values(PERMISSIONS) },
    status: "authenticated",
    isAuthenticated: true,
    login: async () => { throw new Error("noop") },
    logout: async () => undefined,
    refreshUser: async () => undefined,
  } as never
  return (
    <MemoryRouter initialEntries={["/dashboard"]}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <ThemeProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const emptyPage = { items: [], pagination: { count: 0, num_pages: 0, current_page: 1, page_size: 20, next: null, previous: null } }
const superUser = { id: 1, username: "b", is_staff: true, is_superuser: true, role: { codename: "SUPER_ADMIN" }, permissions: Object.values(PERMISSIONS) } as never

describe("Command Center", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
    mockFetchSearch.mockResolvedValue(emptyPage)
  })

  it("opens via Ctrl+K and lists permission-aware commands", async () => {
    render(<SearchCommand />, { wrapper })
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(await screen.findByRole("combobox")).toBeInTheDocument()
    expect(screen.getByText("Go to Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Go to Users")).toBeInTheDocument()
  })

  it("opens via Cmd+K", async () => {
    render(<SearchCommand />, { wrapper })
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(await screen.findByRole("combobox")).toBeInTheDocument()
  })

  it("supports arrow navigation and Escape", async () => {
    const user = userEvent.setup()
    render(<SearchCommand />, { wrapper })
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    const box = await screen.findByRole("combobox")
    await user.type(box, "dashboard")
    fireEvent.keyDown(box, { key: "ArrowDown" })
    fireEvent.keyDown(box, { key: "ArrowUp" })
    fireEvent.keyDown(box, { key: "Escape" })
  })

  it("filters commands by typed text and shows empty guidance", async () => {
    const user = userEvent.setup()
    render(<SearchCommand />, { wrapper })
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    const box = await screen.findByRole("combobox")
    await user.type(box, "zzz-no-such-command")
    await waitFor(() => expect(screen.getByText("No matching results")).toBeInTheDocument())
    expect(screen.getByText(/Try searching articles/)).toBeInTheDocument()
  })

  it("hides unauthorized commands from viewers", () => {
    const viewer = { id: 2, username: "v", is_staff: false, is_superuser: false, role: { codename: "VIEWER" }, permissions: [] } as never
    const cmds = commandsForUser(viewer)
    expect(cmds.some((c) => c.id === "nav-users")).toBe(false)
    expect(cmds.some((c) => c.id === "create-article")).toBe(false)
    expect(cmds.some((c) => c.id === "nav-dashboard")).toBe(true)
  })

  it("filterCommands matches localized labels", async () => {
    await i18n.changeLanguage("en")
    const all = commandsForUser(superUser)
    const t = i18n.getFixedT("en")
    expect(all.length).toBeGreaterThan(5)
    expect(filterCommands(all, "timeline", t).length).toBeGreaterThan(0)
    expect(filterCommands(all, "", t)).toHaveLength(all.length)
  })
})
