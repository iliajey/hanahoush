/** Super Admin user-management feature (Phase 11.5). */
export { UsersWorkspacePage } from "./pages/UsersWorkspacePage"
export { UserFormDialog } from "./components/UserFormDialog"
export { RolePermissionsDialog, UserDetailDialog } from "./components/UserDetailDialog"
export * from "./api"
export * from "./hooks"
export type {
  CreateUserPayload,
  ManagedUser,
  ManagedUserListParams,
  RoleWithPermissions,
  SetPasswordPayload,
  UpdateUserPayload,
} from "./types"
