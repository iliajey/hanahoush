"""Backend tests for the authentication & authorization API."""
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import LoginAttempt, Permission, Role

User = get_user_model()

PASSWORD = "Password@12345"


class AuthAPITestCase(APITestCase):
    """Shared fixtures for the auth suite."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="alice",
            email="alice@hanahoush.local",
            password=PASSWORD,
            first_name="Alice",
        )
        cls.admin = User.objects.create_user(
            username="admin_user",
            email="admin_user@hanahoush.local",
            password=PASSWORD,
            is_superuser=True,
        )
        cls.role = Role.objects.create(name="Editor", codename="editor")
        cls.perm = Permission.objects.create(name="Manage articles", codename="manage_articles", module="articles")
        cls.role.permissions.add(cls.perm)
        cls.user.role = cls.role
        cls.user.save(update_fields=["role"])

    def login(self, username="alice", password=PASSWORD, **extra):
        data = {"username": username, "password": password, **extra}
        return self.client.post("/api/v1/auth/login/", data=data, format="json")

    def auth_header(self, token):
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def obtain_tokens(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json()["data"]


class LoginTests(AuthAPITestCase):
    def test_login_success_returns_tokens_and_user(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        data = body["data"]
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["username"], "alice")
        self.assertEqual(data["user"]["role"]["codename"], "editor")
        self.assertIn("manage_articles", data["user"]["permissions"])

    def test_login_failure_returns_401(self):
        response = self.login(password="WrongPassword")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.json()["success"])

    def test_login_failure_is_audited_and_tracked(self):
        self.login(password="WrongPassword")
        self.assertTrue(LoginAttempt.objects.filter(username="alice", success=False).exists())

    @override_settings(AUTH_MAX_FAILED_ATTEMPTS=3)
    def test_account_locks_after_repeated_failures(self):
        for _ in range(3):
            self.login(password="WrongPassword")
        response = self.login(password=PASSWORD)  # correct password, but locked
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_remember_me_flag_is_accepted(self):
        response = self.login(remember_me=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TokenRefreshTests(AuthAPITestCase):
    def test_refresh_rotates_tokens(self):
        tokens = self.obtain_tokens()
        response = self.client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertIn("access", data)
        self.assertNotEqual(data["access"], tokens["access"])

    def test_refresh_invalid_token_returns_401(self):
        response = self.client.post("/api/v1/auth/refresh/", {"refresh": "not-a-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTests(AuthAPITestCase):
    def test_logout_blacklists_refresh_token(self):
        tokens = self.obtain_tokens()
        response = self.client.post(
            "/api/v1/auth/logout/",
            {"refresh": tokens["refresh"]},
            format="json",
            **self.auth_header(tokens["access"]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # The blacklisted refresh must no longer work.
        refresh_response = self.client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        tokens = self.obtain_tokens()
        response = self.client.post("/api/v1/auth/logout/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeAndProfileTests(AuthAPITestCase):
    def test_me_requires_authentication(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        tokens = self.obtain_tokens()
        response = self.client.get("/api/v1/auth/me/", **self.auth_header(tokens["access"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["username"], "alice")

    def test_profile_patch_updates_fields(self):
        tokens = self.obtain_tokens()
        response = self.client.patch(
            "/api/v1/auth/profile/",
            {"phone": "09120000000", "preferred_language": "fa"},
            format="json",
            **self.auth_header(tokens["access"]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.phone, "09120000000")
        self.assertEqual(self.user.preferred_language, "fa")


class ChangePasswordTests(AuthAPITestCase):
    def test_change_password_success(self):
        tokens = self.obtain_tokens()
        response = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "old_password": PASSWORD,
                "new_password": "NewPassword@678",
                "confirm_password": "NewPassword@678",
            },
            format="json",
            **self.auth_header(tokens["access"]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword@678"))

    def test_change_password_wrong_old_password(self):
        tokens = self.obtain_tokens()
        response = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "old_password": "WrongPassword",
                "new_password": "NewPassword@678",
                "confirm_password": "NewPassword@678",
            },
            format="json",
            **self.auth_header(tokens["access"]),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.json()["errors"])


class PasswordResetTests(AuthAPITestCase):
    def test_reset_request_never_reveals_user(self):
        response = self.client.post(
            "/api/v1/auth/password-reset/",
            {"email": "does-not-exist@hanahoush.local"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reset_request_sends_email_for_existing_user(self):
        response = self.client.post(
            "/api/v1/auth/password-reset/",
            {"email": self.user.email},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("reset-password", mail.outbox[0].body)

    def test_reset_confirm_sets_new_password(self):
        from django.contrib.auth.tokens import default_token_generator

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        response = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "new_password": "ResetPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("ResetPassword@123"))


class RolesAndPermissionsTests(AuthAPITestCase):
    def test_roles_require_authentication(self):
        response = self.client.get("/api/v1/auth/roles/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_roles_list(self):
        tokens = self.obtain_tokens()
        response = self.client.get("/api/v1/auth/roles/", **self.auth_header(tokens["access"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["success"])
        self.assertTrue(any(item["codename"] == "editor" for item in response.json()["data"]))

    def test_permissions_list(self):
        tokens = self.obtain_tokens()
        response = self.client.get("/api/v1/auth/permissions/", **self.auth_header(tokens["access"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item["codename"] == "manage_articles" for item in response.json()["data"]))
