import type { UserProfile } from "../types"
import { PERMISSIONS, ALL_PERMISSIONS } from "../permissions"

/** Role-aware user fixtures mirroring the backend seeders
 * (apps/accounts/seeders.py → ROLE_DEFINITIONS). Used by authorization,
 * navigation and dashboard tests so the capability matrix is asserted against
 * the exact backend permission catalog. */

interface FixtureRole {
  id: number
  name: string
  codename: string
}

const role = (id: number, name: string, codename: string): FixtureRole => ({ id, name, codename })

function user(
  username: string,
  roleId: number,
  roleName: string,
  codename: string,
  permissions: string[],
  is_staff: boolean,
): UserProfile {
  return {
    id: roleId * 10,
    username,
    email: `${username}@hanahoush.local`,
    first_name: username.slice(0, 1).toUpperCase(),
    last_name: username.slice(1).toUpperCase(),
    phone: "",
    preferred_language: "en",
    is_active: true,
    is_staff,
    role: role(roleId, roleName, codename),
    permissions,
    date_joined: new Date().toISOString(),
  }
}

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  CONTENT_MANAGER: "CONTENT_MANAGER",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const

export const roleUsers: Record<(typeof ROLES)[keyof typeof ROLES], UserProfile> = {
  SUPER_ADMIN: user("superadmin", 1, "Super Admin", ROLES.SUPER_ADMIN, [...ALL_PERMISSIONS], true),
  COMPANY_ADMIN: user("companyadmin", 2, "Company Admin", ROLES.COMPANY_ADMIN, [
    PERMISSIONS.ARTICLES_VIEW,
    PERMISSIONS.ARTICLES_CREATE,
    PERMISSIONS.ARTICLES_UPDATE,
    PERMISSIONS.ARTICLES_DELETE,
    PERMISSIONS.ARTICLES_PUBLISH,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.PROJECTS_PUBLISH,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_CREATE,
    PERMISSIONS.SERVICES_UPDATE,
    PERMISSIONS.SERVICES_DELETE,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_UPDATE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.EDITORIAL_VIEW,
    PERMISSIONS.EDITORIAL_MANAGE,
    PERMISSIONS.EDITORIAL_APPROVE,
    PERMISSIONS.EDITORIAL_SCHEDULE,
    PERMISSIONS.INTEGRATION_VIEW,
  ], true),
  CONTENT_MANAGER: user("contentmanager", 3, "Content Manager", ROLES.CONTENT_MANAGER, [
    PERMISSIONS.ARTICLES_VIEW,
    PERMISSIONS.ARTICLES_CREATE,
    PERMISSIONS.ARTICLES_UPDATE,
    PERMISSIONS.ARTICLES_DELETE,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_CREATE,
    PERMISSIONS.SERVICES_UPDATE,
    PERMISSIONS.SERVICES_DELETE,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_UPDATE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.EDITORIAL_VIEW,
    PERMISSIONS.EDITORIAL_MANAGE,
    PERMISSIONS.EDITORIAL_REVIEW,
    PERMISSIONS.EDITORIAL_SCHEDULE,
  ], true),
  PROJECT_MANAGER: user("projectmanager", 4, "Project Manager", ROLES.PROJECT_MANAGER, [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.PROJECTS_PUBLISH,
    PERMISSIONS.ARTICLES_VIEW,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.EDITORIAL_VIEW,
    PERMISSIONS.EDITORIAL_REVIEW,
  ], true),
  EDITOR: user("editor", 5, "Editor", ROLES.EDITOR, [
    PERMISSIONS.ARTICLES_VIEW,
    PERMISSIONS.ARTICLES_CREATE,
    PERMISSIONS.ARTICLES_UPDATE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.EDITORIAL_VIEW,
    PERMISSIONS.EDITORIAL_REVIEW,
  ], false),
  VIEWER: user("viewer", 6, "Viewer", ROLES.VIEWER, [
    PERMISSIONS.ARTICLES_VIEW,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.EDITORIAL_VIEW,
  ], false),
}

/** Django superuser (username `admin`) — superuser, staff, full catalog. */
export const superuserAdmin: UserProfile = {
  id: 999,
  username: "admin",
  email: "admin@hanahoush.local",
  first_name: "Admin",
  last_name: "User",
  phone: "",
  preferred_language: "en",
  is_active: true,
  is_staff: true,
  role: null,
  permissions: [...ALL_PERMISSIONS],
  date_joined: new Date().toISOString(),
}