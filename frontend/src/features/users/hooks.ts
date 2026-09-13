/** React Query hooks for the Super Admin user-management surface. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  activateUser,
  createUser,
  deactivateUser,
  fetchRoleCatalog,
  fetchUser,
  listUsers,
  setUserPassword,
  updateUser,
} from "./api"
import type {
  CreateUserPayload,
  ManagedUserListParams,
  SetPasswordPayload,
  UpdateUserPayload,
} from "./types"

export const userKeys = {
  all: ["admin", "users"] as const,
  list: (params: ManagedUserListParams) => ["admin", "users", "list", params] as const,
  detail: (id: number) => ["admin", "users", "detail", id] as const,
  roles: ["admin", "users", "roles"] as const,
}

export function useUsers(params: ManagedUserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
  })
}

export function useUserDetail(id: number | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: () => fetchUser(id as number),
    enabled: id != null,
  })
}

export function useRoleCatalog() {
  return useQuery({
    queryKey: userKeys.roles,
    queryFn: fetchRoleCatalog,
    staleTime: 5 * 60 * 1000,
  })
}

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: userKeys.all })
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: invalidate,
  })
}

export function useSetUserPassword() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SetPasswordPayload }) => setUserPassword(id, payload),
    onSuccess: invalidate,
  })
}

export function useActivateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: number) => activateUser(id),
    onSuccess: invalidate,
  })
}

export function useDeactivateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: invalidate,
  })
}
