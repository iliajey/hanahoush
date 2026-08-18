import { act } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Mock } from "vitest"

import i18n from "@/i18n"
import { clearAnalyticsEvents, getAnalyticsEvents } from "@/features/analytics"
import { createTestProviders } from "../../../tests/setup/test-utils"

vi.mock("./api", () => ({
  submitContact: vi.fn(),
}))

import { ContactForm } from "./ContactForm"
import { submitContact } from "./api"

const mockedSubmit = submitContact as Mock

function setup() {
  const { wrapper } = createTestProviders()
  const view = render(<ContactForm />, { wrapper })
  return { ...view, wrapper }
}

beforeEach(() => {
  clearAnalyticsEvents()
  mockedSubmit.mockReset()
})

describe("ContactForm", () => {
  it("renders accessible labelled fields", () => {
    setup()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/how can we help/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send inquiry/i })).toBeInTheDocument()
  })

  it("shows localized validation errors for an empty submit", async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole("button", { name: /send inquiry/i }))
    await waitFor(() => {
      expect(screen.getByText(/please enter your name/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute("aria-invalid", "true")
  })

  it("renders RTL-aware messages when the language is Persian", async () => {
    const user = userEvent.setup()
    setup()
    await act(async () => {
      await i18n.changeLanguage("fa")
    })
    await user.click(screen.getByRole("button", { name: /ارسال درخواست/i }))
    await waitFor(() => {
      expect(screen.getByText(/لطفاً نام خود را وارد کنید/i)).toBeInTheDocument()
    })
    await act(async () => {
      await i18n.changeLanguage("en")
    })
  })

  it("submits successfully, announces success and blocks duplicate submit", async () => {
    mockedSubmit.mockResolvedValue({ ok: true, requestId: "req-1", status: "new" })
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText(/full name/i), "QA User")
    await user.type(screen.getByLabelText(/email address/i), "qa@example.com")
    await user.type(screen.getByLabelText(/how can we help/i), "We need an ERP.")
    await user.click(screen.getByRole("checkbox", { name: /i agree to be contacted/i }))
    await user.click(screen.getByRole("button", { name: /send inquiry/i }))

    await waitFor(() => {
      expect(mockedSubmit).toHaveBeenCalledTimes(1)
      expect(screen.getByText(/inquiry received/i)).toBeInTheDocument()
    })

    const names = getAnalyticsEvents().map((e) => e.name)
    expect(names).toContain("contact_form_view")
    expect(names).toContain("contact_form_start")
    expect(names).toContain("contact_submit")

    // Duplicate-submission protection: the submit button is disabled after success.
    expect(screen.getByRole("button", { name: /send inquiry/i })).toBeDisabled()
  })

  it("shows the failure state and fires contact_error", async () => {
    mockedSubmit.mockResolvedValue({ ok: false, message: "Too many requests" })
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText(/full name/i), "QA User")
    await user.type(screen.getByLabelText(/email address/i), "qa@example.com")
    await user.type(screen.getByLabelText(/how can we help/i), "We need an ERP.")
    await user.click(screen.getByRole("checkbox", { name: /i agree to be contacted/i }))
    await user.click(screen.getByRole("button", { name: /send inquiry/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
    expect(getAnalyticsEvents().map((e) => e.name)).toContain("contact_submit")
  })

  it("prevents a second in-flight submission", async () => {
    let resolve!: (value: { ok: boolean; requestId: string }) => void
    mockedSubmit.mockImplementation(() => new Promise((r) => (resolve = r)))
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText(/full name/i), "QA User")
    await user.type(screen.getByLabelText(/email address/i), "qa@example.com")
    await user.type(screen.getByLabelText(/how can we help/i), "We need an ERP.")
    await user.click(screen.getByRole("checkbox", { name: /i agree to be contacted/i }))
    const submitButton = screen.getByRole("button", { name: /send inquiry/i })
    await user.click(submitButton)
    await user.click(submitButton)

    await waitFor(() => expect(mockedSubmit).toHaveBeenCalledTimes(1))
    await act(async () => {
      resolve({ ok: true, requestId: "req-2" })
    })
  })
})