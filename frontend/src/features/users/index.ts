/** Super Admin user-management feature (Phase 11.5 + 12). */
export { UsersWorkspacePage } from "./pages/UsersWorkspacePage"
export { UserCreatePage } from "./pages/UserCreatePage"
export { UserDetailPage } from "./pages/UserDetailPage"
export { UserEditPage } from "./pages/UserEditPage"
export { UserFormDialog } from "./components/UserFormDialog"
export { RoleSelect } from "./components/RoleSelect"
export { ConfirmActionDialog } from "./components/ConfirmActionDialog"
export { RolePermissionsDialog, UserDetailDialog } from "./components/UserDetailDialog"
export * from "./api"
export * from "./hooks"
export type {
  CreateUserPayload,
  ManagedUser,
  ManagedUserListParams,
  PreferredLanguage,
  RoleWithPermissions,
  SetPasswordPayload,
  UpdateUserPayload,
} from "./types"
