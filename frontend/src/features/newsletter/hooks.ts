import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/toast"
import i18n from "@/i18n"

import {
  activateSubscriber,
  deactivateSubscriber,
  exportNewsletterSubscribers,
  listNewsletterSubscribers,
} from "./api"
import type { NewsletterListParams } from "./types"

export const newsletterKeys = {
  all: ["admin", "newsletter"] as const,
  list: (params: NewsletterListParams) => ["admin", "newsletter", "list", params] as const,
}

export function useNewsletterSubscribers(params: NewsletterListParams) {
  return useQuery({
    queryKey: newsletterKeys.list(params),
    queryFn: () => listNewsletterSubscribers(params),
  })
}

export function useToggleSubscriber() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const refresh = () => queryClient.invalidateQueries({ queryKey: newsletterKeys.all })
  const activate = useMutation({
    mutationFn: (id: number) => activateSubscriber(id),
    onSuccess: () => {
      refresh()
      toast({ title: i18n.t("newsletterWorkspace.activated"), variant: "success" })
    },
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateSubscriber(id),
    onSuccess: () => {
      refresh()
      toast({ title: i18n.t("newsletterWorkspace.deactivated"), variant: "success" })
    },
  })
  return { activate, deactivate }
}

export function useNewsletterExport(params: NewsletterListParams) {
  const { toast } = useToast()
  return useMutation({
    mutationFn: () => exportNewsletterSubscribers(params),
    onSettled: (_, error) => {
      if (error) toast({ title: i18n.t("newsletterWorkspace.exportFailed"), variant: "error" })
      else toast({ title: i18n.t("newsletterWorkspace.exportDone"), variant: "success" })
    },
  })
}