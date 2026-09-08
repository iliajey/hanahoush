"""Backend tests for the public registration endpoint and default-role policy."""
from django.contrib.auth import get_user_model
from django.test import override_settings

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import LoginAudit, Role

User = get_user_model()

PASSWORD = "Register@12345"
URL = "/api/v1/auth/register/"


def valid_payload(**overrides):
    payload = {
        "username": "newuser",
        "first_name": "New",
        "last_name": "User",
        "email": "newuser@hanahoush.local",
        "phone": "09120000000",
        "password": PASSWORD,
        "confirm_password": PASSWORD,
    }
    payload.update(overrides)
    return payload


class RegisterTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.viewer_role = Role.objects.create(
            name="Viewer", codename="VIEWER", is_system=True
        )
        cls.privileged_role = Role.objects.create(
            name="Super Admin", codename="SUPER_ADMIN", is_system=True
        )

    def test_register_creates_user_with_viewer_role(self):
        response = self.client.post(URL, valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["username"], "newuser")
        self.assertEqual(body["data"]["role"], "VIEWER")

        user = User.objects.get(username="newuser")
        # Password is hashed, never stored plaintext.
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))
        self.assertEqual(user.email, "newuser@hanahoush.local")
        self.assertEqual(user.first_name, "New")
        self.assertEqual(user.last_name, "User")
        self.assertEqual(user.phone, "09120000000")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, self.viewer_role)

    def test_register_never_grants_privileged_roles(self):
        response = self.client.post(
            URL,
            valid_payload(username="attacker", role="SUPER_ADMIN", is_staff=True, is_superuser=True),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="attacker")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, self.viewer_role)

    def test_duplicate_username_is_rejected(self):
        self.client.post(URL, valid_payload(), format="json")
        self.client.post(
            URL, valid_payload(username="NewUser", email="other@hanahoush.local"), format="json"
        )
        self.assertEqual(User.objects.filter(username__iexact="newuser").count(), 1)
        # Case-insensitive duplicate must also be rejected.
        response = self.client.post(
            URL, valid_payload(username="newuser", email="third@hanahoush.local"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.json()["errors"])

    def test_duplicate_email_is_rejected(self):
        self.client.post(URL, valid_payload(), format="json")
        response = self.client.post(
            URL, valid_payload(username="another", email="NEWUSER@hanahoush.local"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json()["errors"])

    def test_invalid_username_format_is_rejected(self):
        response = self.client.post(
            URL, valid_payload(username="not valid!username"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.json()["errors"])

    def test_invalid_email_is_rejected(self):
        response = self.client.post(URL, valid_payload(email="not-an-email"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json()["errors"])

    def test_invalid_phone_is_rejected(self):
        response = self.client.post(URL, valid_payload(phone="abc123"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.json()["errors"])

    def test_missing_required_fields_are_rejected(self):
        response = self.client.post(URL, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ("username", "email", "password", "confirm_password"):
            self.assertIn(field, response.json()["errors"])

    def test_password_mismatch_is_rejected(self):
        response = self.client.post(
            URL, valid_payload(confirm_password="Different@12345"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.json()["errors"])

    def test_weak_password_is_rejected(self):
        response = self.client.post(URL, valid_payload(password="12345678"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.json()["errors"])

    def test_registration_is_audited(self):
        self.client.post(URL, valid_payload(), format="json")
        self.assertTrue(
            LoginAudit.objects.filter(
                username="newuser", event="register", success=True
            ).exists()
        )

    @override_settings(REGISTRATION_DEFAULT_ROLE="VIEWER")
    def test_custom_default_role_configuration(self):
        self.client.post(URL, valid_payload(username="customrole"), format="json")
        user = User.objects.get(username="customrole")
        self.assertEqual(user.role.codename, "VIEWER")

    def test_register_does_not_issue_tokens(self):
        response = self.client.post(URL, valid_payload(), format="json")
        self.assertNotIn("access", response.json()["data"])
        self.assertNotIn("refresh", response.json()["data"])