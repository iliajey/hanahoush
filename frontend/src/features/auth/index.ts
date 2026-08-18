/** Auth feature — public barrel. */
export { AuthProvider, useAuth } from "./services/AuthProvider"
export { useLogin } from "./hooks/useLogin"
export { useLogout } from "./hooks/useLogout"
export { useUser } from "./hooks/useUser"
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
