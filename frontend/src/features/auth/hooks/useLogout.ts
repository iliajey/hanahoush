import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "./useAuth"

/** Logout mutation — ends the session via AuthProvider. */
export function useLogout() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.clear()
    },
  })
}
