/** Auth feature — public barrel. */
export { AuthProvider, useAuth } from "./services/AuthProvider"
export { useLogin } from "./hooks/useLogin"
export { useLogout } from "./hooks/useLogout"
export { useUser } from "./hooks/useUser"
export { useAuthorization } from "./hooks/useAuthorization"
export { useChangePassword } from "./hooks/useChangePassword"
export { useRoles, usePermissions } from "./hooks/useRolesPermissions"
export { loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, profileSchema } from "./schemas"
export type {
  LoginFormValues,
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
  ChangePasswordFormValues,
  ProfileFormValues,
} from "./schemas"
export type {
  UserProfile,
  Role,
  Permission,
  RoleBrief,
  LoginPayload,
  LoginResponse,
  AuthStatus,
} from "./types"
export { ProtectedRoute } from "./components/ProtectedRoute"
export { GuestRoute } from "./components/GuestRoute"
export { PasswordInput } from "./components/PasswordInput"
export { RememberMe } from "./components/RememberMe"
export { ProfileMenu } from "./components/ProfileMenu"
export { UserAvatar } from "./components/UserAvatar"

// Phase 9G — centralized authorization layer
export { PERMISSIONS, ALL_PERMISSIONS, PERMISSION_MODULES } from "./permissions"
export type { PermissionCode } from "./permissions"
export { ROLE_CODES, ROLE_CATALOG, getRoleDefinition, CAPABILITIES, canUseCapability, grantedCapabilities } from "./role-config"
export type { RoleCode, RoleCategory, RoleDefinition, CapabilityKey, CapabilityDefinition } from "./role-config"
export {
  AuthorizationGate,
  RequirePermission,
  RequireRole,
  RequireAnyPermission,
  RequireStaff,
} from "./guards"
export type { AuthorizationGateProps } from "./guards"
