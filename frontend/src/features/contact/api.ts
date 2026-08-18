import { apiClient, toApiError } from "@/shared/api/axiosClient"

import { contactAnalytics } from "../analytics/domains"
import type { ContactFormValues, ContactSubmissionResult } from "./types"

export { contactAnalytics } from "../analytics/domains"

/**
 * Submit a contact inquiry to the public (throttled, honeypot-protected)
 * endpoint. Never throws — returns a normalized result so the form can render
 * success / error states directly.
 */
export async function submitContact(
  values: ContactFormValues,
): Promise<ContactSubmissionResult> {
  try {
    const response = await apiClient.post<{
      success: boolean
      data: { request_id?: string; status?: string } | null
      message?: string
      errors?: Record<string, string[]> | string[] | string | null
    }>("/contact/", {
      name: values.name,
      email: values.email.toLowerCase().trim(),
      phone: values.phone,
      company: values.company,
      subject: values.subject,
      service_category: values.service_category,
      project_type: values.project_type,
      budget_range: values.budget_range,
      preferred_contact: values.preferred_contact,
      message: values.message,
      consent: values.consent,
      locale: values.locale,
      source: values.source,
      website: values.website,
    })
    contactAnalytics.success(response.data?.data?.request_id)
    return {
      ok: true,
      requestId: response.data?.data?.request_id,
      status: response.data?.data?.status,
    }
  } catch (error) {
    const apiError = toApiError(error)
    contactAnalytics.error(apiError.message)
    return {
      ok: false,
      message: apiError.message,
      errors: apiError.errors,
    }
  }
}