import { useMutation, useQueryClient } from "@tanstack/react-query"

import { changePassword } from "../api/authApi"
import type { ChangePasswordPayload } from "../types"

/** Change-password mutation. */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    },
  })
}
