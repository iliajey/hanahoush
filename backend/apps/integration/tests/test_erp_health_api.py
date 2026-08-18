"""Tests for the staff-only ERP health endpoint (authorization + payload)."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role, User

URL = "/api/v1/integration/erp/health/"


class ErpHealthApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = User.objects.create_user(
            username="staff",
            email="staff@hanahoush.local",
            password="pass12345",  # noqa: S106
            is_staff=True,
        )
        cls.superuser = User.objects.create_superuser(
            username="root", email="root@hanahoush.local", password="pass12345"  # noqa: S106
        )
        cls.normal = User.objects.create_user(
            username="visitor", email="visitor@hanahoush.local", password="pass12345"  # noqa: S106
        )

        cls.integration_perm = Permission.objects.create(
            name="View ERP integration status",
            codename="integration.view",
            module="integration",
        )
        cls.operator_role = Role.objects.create(
            name="ERP Operator", codename="ERP_OPERATOR", description="", is_system=False
        )
        cls.operator_role.permissions.add(cls.integration_perm)
        cls.operator = User.objects.create_user(
            username="operator", email="operator@hanahoush.local", password="pass12345"  # noqa: S106
        )
        cls.operator.role = cls.operator_role
        cls.operator.save()

        cls.admin_role = Role.objects.create(
            name="Admin", codename="admin", description="", is_system=False
        )
        cls.role_admin = User.objects.create_user(
            username="roleadmin", email="roleadmin@hanahoush.local", password="pass12345"  # noqa: S106
        )
        cls.role_admin.role = cls.admin_role
        cls.role_admin.save()

    def test_anonymous_denied(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_denied(self):
        self.client.force_authenticate(self.normal)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_allowed_disabled_state(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["enabled"], False)
        self.assertEqual(body["data"]["provider"], "null")
        self.assertEqual(body["data"]["connectivity"], "disabled")

    def test_superuser_allowed(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_integration_permission_allowed(self):
        self.client.force_authenticate(self.operator)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_role_allowed(self):
        self.client.force_authenticate(self.role_admin)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cache_control_no_store(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(URL)
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_request_id_in_payload(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(URL, HTTP_X_REQUEST_ID="rid-health-1")
        self.assertEqual(response.json()["data"]["request_id"], "rid-health-1")

    def test_probe_param_disabled_still_no_network(self):
        # ERP disabled: probe=true must not trigger any network and stays disabled.
        self.client.force_authenticate(self.staff)
        response = self.client.get(URL, {"probe": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["connectivity"], "disabled")

    def test_post_not_allowed(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post(URL, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
