import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { listContacts, markContactHandled, updateContactStatus, type ContactListParams, type ContactStatus } from "./admin"

export const contactKeys = {
  all: ["admin", "contact"] as const,
  list: (params: ContactListParams) => ["admin", "contact", "list", params] as const,
}

export function useAdminContacts(params: ContactListParams) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => listContacts(params),
  })
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: contactKeys.all })
  const change = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContactStatus }) => updateContactStatus(id, status),
    onSuccess: invalidate,
  })
  const handled = useMutation({
    mutationFn: (id: number) => markContactHandled(id),
    onSuccess: invalidate,
  })
  return { change, handled }
}