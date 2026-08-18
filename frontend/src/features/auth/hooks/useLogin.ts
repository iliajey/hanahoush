import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LoginPayload } from "../types"
import { useAuth } from "./useAuth"

/** Login mutation — stores tokens + user via AuthProvider. */
export function useLogin() {
  const { login } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    },
  })
}
