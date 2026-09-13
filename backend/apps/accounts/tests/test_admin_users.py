"""Backend tests for the Super Admin user-management API (Phase 11.5).

Covers the RBAC matrix (only SUPER_ADMIN/superuser may manage accounts),
account CRUD, controlled password reset, activation, self-lockout
protection and the guarantee that no password material is ever serialized.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role

User = get_user_model()

PASSWORD = "Password@12345"
LIST_URL = "/api/v1/admin/users/"


def user_payload(**overrides):
    payload = {
        "username": "managed.user",
        "first_name": "Managed",
        "last_name": "User",
        "email": "managed@hanahoush.local",
        "phone": "09120000001",
        "password": "Managed@12345",
        "confirm_password": "Managed@12345",
        "role": "EDITOR",
        "is_active": True,
        "is_staff": False,
    }
    payload.update(overrides)
    return payload


class AdminUserTestCase(APITestCase):
    """Fixtures: a superuser, one SUPER_ADMIN-role user and one per role."""

    @classmethod
    def setUpTestData(cls):
        cls.super_role = Role.objects.create(
            name="Super Admin", codename="SUPER_ADMIN", is_system=True
        )
        cls.company_role = Role.objects.create(
            name="Company Admin", codename="COMPANY_ADMIN", is_system=True
        )
        cls.editor_role = Role.objects.create(
            name="Editor", codename="EDITOR", is_system=True
        )
        cls.viewer_role = Role.objects.create(
            name="Viewer", codename="VIEWER", is_system=True
        )

        cls.superuser = User.objects.create_user(
            username="root", email="root@hanahoush.local", password=PASSWORD,
            is_superuser=True, is_staff=True,
        )
        cls.super_admin = User.objects.create_user(
            username="superadmin", email="superadmin@hanahoush.local",
            password=PASSWORD, is_staff=True, is_superuser=True,
        )
        cls.super_admin.role = cls.super_role
        cls.super_admin.save(update_fields=["role"])
        cls.company_admin = User.objects.create_user(
            username="companyadmin", email="companyadmin@hanahoush.local",
            password=PASSWORD, is_staff=True,
        )
        cls.company_admin.role = cls.company_role
        cls.company_admin.save(update_fields=["role"])
        cls.editor = User.objects.create_user(
            username="editor", email="editor@hanahoush.local", password=PASSWORD
        )
        cls.editor.role = cls.editor_role
        cls.editor.save(update_fields=["role"])
        cls.viewer = User.objects.create_user(
            username="viewer", email="viewer@hanahoush.local", password=PASSWORD
        )
        cls.viewer.role = cls.viewer_role
        cls.viewer.save(update_fields=["role"])

    def login(self, username, password=PASSWORD):
        response = self.client.post(
            "/api/v1/auth/login/", data={"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json()["data"]["access"]

    def auth(self, username):
        token = self.login(username)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


class AdminUserRBACTests(AdminUserTestCase):
    def test_anonymous_cannot_list_users(self):
        response = self.client.get(LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_super_roles_get_403(self):
        for username in ("companyadmin", "editor", "viewer"):
            with self.subTest(username=username):
                response = self.client.get(LIST_URL, **self.auth(username))
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superadmin_and_superuser_can_list(self):
        for username in ("superadmin", "root"):
            with self.subTest(username=username):
                response = self.client.get(LIST_URL, **self.auth(username))
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_never_contains_password_material(self):
        response = self.client.get(LIST_URL, **self.auth("superadmin"))
        body = response.content.decode()
        self.assertNotIn("password", body)
        self.assertNotIn("pbkdf2", body)
        self.assertNotIn("md5$", body)


class AdminUserCreateTests(AdminUserTestCase):
    def test_create_user_assigns_role_and_hashes_password(self):
        response = self.client.post(
            LIST_URL, data=user_payload(), format="json", **self.auth("superadmin")
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()["data"]
        self.assertEqual(data["role"]["codename"], "EDITOR")
        self.assertNotIn("password", data)
        user = User.objects.get(username="managed.user")
        self.assertTrue(user.check_password("Managed@12345"))
        self.assertFalse(user.is_superuser)

    def test_create_rejects_duplicate_username_case_insensitive(self):
        User.objects.create_user(
            username="managed.user", email="taken@hanahoush.local", password=PASSWORD
        )
        response = self.client.post(
            LIST_URL, data=user_payload(username="MANAGED.USER"), format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rejects_duplicate_email(self):
        User.objects.create_user(
            username="email.owner", email="managed@hanahoush.local", password=PASSWORD
        )
        response = self.client.post(
            LIST_URL,
            data=user_payload(username="other.user", email="MANAGED@hanahoush.local"),
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rejects_weak_password(self):
        response = self.client.post(
            LIST_URL,
            data=user_payload(
                username="weak.user", email="weak@hanahoush.local",
                password="password", confirm_password="password",
            ),
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rejects_password_mismatch(self):
        response = self.client.post(
            LIST_URL,
            data=user_payload(
                username="mismatch.user", email="mismatch@hanahoush.local",
                confirm_password="Different@123",
            ),
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unknown_role_rejected(self):
        response = self.client.post(
            LIST_URL,
            data=user_payload(role="NOT_A_ROLE"),
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_is_superuser_never_writable_via_api(self):
        response = self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/", data={"is_superuser": True},
            format="json", **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.viewer.refresh_from_db()
        self.assertFalse(self.viewer.is_superuser)


class AdminUserUpdateTests(AdminUserTestCase):
    def test_update_fields_and_role(self):
        response = self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/",
            data={"first_name": "Renamed", "role": "EDITOR"},
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertEqual(data["first_name"], "Renamed")
        self.assertEqual(data["role"]["codename"], "EDITOR")

    def test_set_password_and_relogin(self):
        response = self.client.post(
            f"{LIST_URL}{self.viewer.pk}/set-password/",
            data={"new_password": "Freshly@12345", "confirm_password": "Freshly@12345"},
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        login = self.client.post(
            "/api/v1/auth/login/",
            data={"username": "viewer", "password": "Freshly@12345"}, format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)


class PreferredLanguageTests(AdminUserTestCase):
    def test_read_includes_preferred_language(self):
        response = self.client.get(
            f"{LIST_URL}{self.viewer.pk}/", **self.auth("superadmin")
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("preferred_language", response.json()["data"])

    def test_update_preferred_language(self):
        response = self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/",
            data={"preferred_language": "ar"},
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["preferred_language"], "ar")

    def test_update_rejects_invalid_language(self):
        response = self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/",
            data={"preferred_language": "xx"},
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminActionAuditTests(AdminUserTestCase):
    def test_update_writes_login_audit_row(self):
        from apps.accounts.models import LoginAudit

        response = self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/",
            data={"first_name": "Audited"},
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            LoginAudit.objects.filter(
                username="viewer", detail__startswith="admin_user_updated:"
            ).exists()
        )

    def test_role_change_audit_detail_names_roles(self):
        from apps.accounts.models import LoginAudit

        response = self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/",
            data={"role": "EDITOR"},
            format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = LoginAudit.objects.filter(
            username="viewer", detail__contains="role_changed:"
        ).first()
        self.assertIsNotNone(row)
        self.assertIn("VIEWER", row.detail)
        self.assertIn("EDITOR", row.detail)

    def test_activate_and_deactivate_write_audit_rows(self):
        from apps.accounts.models import LoginAudit

        self.client.post(
            f"{LIST_URL}{self.viewer.pk}/deactivate/",
            format="json",
            **self.auth("superadmin"),
        )
        self.assertTrue(
            LoginAudit.objects.filter(
                username="viewer", detail="admin_user_updated:deactivated"
            ).exists()
        )
        self.client.post(
            f"{LIST_URL}{self.viewer.pk}/activate/",
            format="json",
            **self.auth("superadmin"),
        )
        self.assertTrue(
            LoginAudit.objects.filter(
                username="viewer", detail="admin_user_updated:activated"
            ).exists()
        )

    def test_audit_rows_never_contain_secrets(self):
        from apps.accounts.models import LoginAudit

        self.client.patch(
            f"{LIST_URL}{self.viewer.pk}/",
            data={"first_name": "Audited"},
            format="json",
            **self.auth("superadmin"),
        )
        for row in LoginAudit.objects.filter(username="viewer"):
            self.assertNotIn("password", row.detail.lower())
            self.assertNotIn("token", row.detail.lower())


class LastAdminProtectionTests(AdminUserTestCase):
    def test_cannot_demote_last_super_admin_holder(self):
        # ``super_admin`` is the only SUPER_ADMIN-role holder in fixtures;
        # ``root`` (superuser without the role) acts as the second admin.
        headers = self.auth("root")
        response = self.client.patch(
            f"{LIST_URL}{self.super_admin.pk}/",
            data={"role": "VIEWER"},
            format="json",
            **headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.super_admin.refresh_from_db()
        self.assertEqual(self.super_admin.role.codename, "SUPER_ADMIN")

    def test_cannot_deactivate_last_super_admin_holder(self):
        headers = self.auth("root")
        response = self.client.post(
            f"{LIST_URL}{self.super_admin.pk}/deactivate/",
            format="json",
            **headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.super_admin.refresh_from_db()
        self.assertTrue(self.super_admin.is_active)


class AdminUserActivationTests(AdminUserTestCase):
    def test_deactivate_blocks_login_then_reactivate(self):
        response = self.client.post(
            f"{LIST_URL}{self.viewer.pk}/deactivate/", format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.viewer.refresh_from_db()
        self.assertFalse(self.viewer.is_active)

        login = self.client.post(
            "/api/v1/auth/login/",
            data={"username": "viewer", "password": PASSWORD}, format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(
            f"{LIST_URL}{self.viewer.pk}/activate/", format="json",
            **self.auth("superadmin"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        login = self.client.post(
            "/api/v1/auth/login/",
            data={"username": "viewer", "password": PASSWORD}, format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_delete_is_disabled(self):
        response = self.client.delete(
            f"{LIST_URL}{self.viewer.pk}/", **self.auth("superadmin")
        )
        self.assertIn(
            response.status_code,
            {status.HTTP_405_METHOD_NOT_ALLOWED, status.HTTP_403_FORBIDDEN},
        )


class SelfProtectionTests(AdminUserTestCase):
    """An administrator must not be able to lock themselves out."""

    def setUp(self):
        self.headers = self.auth("superadmin")

    def test_cannot_deactivate_self(self):
        response = self.client.patch(
            f"{LIST_URL}{self.super_admin.pk}/", data={"is_active": False},
            format="json", **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(
            f"{LIST_URL}{self.super_admin.pk}/deactivate/", format="json",
            **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.super_admin.refresh_from_db()
        self.assertTrue(self.super_admin.is_active)

    def test_cannot_remove_own_staff_status(self):
        response = self.client.patch(
            f"{LIST_URL}{self.super_admin.pk}/", data={"is_staff": False},
            format="json", **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.super_admin.refresh_from_db()
        self.assertTrue(self.super_admin.is_staff)

    def test_cannot_demote_own_super_admin_role(self):
        response = self.client.patch(
            f"{LIST_URL}{self.super_admin.pk}/", data={"role": "VIEWER"},
            format="json", **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.super_admin.refresh_from_db()
        self.assertEqual(self.super_admin.role.codename, "SUPER_ADMIN")

    def test_cannot_demote_own_role_to_none(self):
        response = self.client.patch(
            f"{LIST_URL}{self.super_admin.pk}/", data={"role": None},
            format="json", **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminRoleCatalogTests(AdminUserTestCase):
    def test_roles_endpoint_returns_catalog_with_permissions(self):
        response = self.client.get(f"{LIST_URL}roles/", **self.auth("superadmin"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codenames = {role["codename"] for role in response.json()["data"]}
        self.assertIn("SUPER_ADMIN", codenames)
        self.assertIn("VIEWER", codenames)

    def test_roles_endpoint_forbidden_for_non_super_admin(self):
        response = self.client.get(f"{LIST_URL}roles/", **self.auth("editor"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_roles_endpoint_never_exposes_passwords(self):
        response = self.client.get(f"{LIST_URL}roles/", **self.auth("superadmin"))
        self.assertNotIn("password", response.content.decode())
