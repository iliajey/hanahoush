"""Phase 23 security regression: password-change token invalidation + bypass matrix."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role

User = get_user_model()
PWD = "Security@12345"


def make_role(codename, perms=()):
    role = Role.objects.create(name=codename, codename=codename, is_system=False)
    for codename_ in perms:
        perm, _ = Permission.objects.get_or_create(
            codename=codename_, defaults={"name": codename_, "module": codename_.split(".")[0]}
        )
        role.permissions.add(perm)
    return role


def make_user(username, role=None, staff=False, superuser=False):
    user = User.objects.create_user(
        username=username, email=f"{username}@hanahoush.local", password=PWD,
        is_staff=staff, is_superuser=superuser,
    )
    if role is not None:
        user.role = role
        user.save(update_fields=["role"])
    return user


class PasswordChangeInvalidatesTokensTests(APITestCase):
    def login(self, username, password=PWD):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": username, "password": password}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json()["data"]

    def test_other_refresh_invalid_after_password_change(self):
        user = make_user("pwdvictim")
        session_a = self.login("pwdvictim")
        session_b = self.login("pwdvictim")
        response = self.client.post(
            "/api/v1/auth/change-password/",
            {"old_password": PWD, "new_password": "Newer@67890", "confirm_password": "Newer@67890"},
            format="json", HTTP_AUTHORIZATION=f"Bearer {session_a['access']}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        retry = self.client.post(
            "/api/v1/auth/refresh/", {"refresh": session_b["refresh"]}, format="json")
        self.assertEqual(retry.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_reset_invalidates_target_tokens(self):
        super_role = make_role("SUPER_ADMIN_X", [])
        admin = make_user("secadmin", role=super_role, staff=True, superuser=True)
        target = make_user("sectarget")
        tokens = self.login("sectarget")
        admin_tokens = self.login("secadmin")
        response = self.client.post(
            f"/api/v1/admin/users/{target.pk}/set-password/",
            {"new_password": "Reset@67890", "confirm_password": "Reset@67890"},
            format="json", HTTP_AUTHORIZATION=f"Bearer {admin_tokens['access']}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        retry = self.client.post(
            "/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(retry.status_code, status.HTTP_401_UNAUTHORIZED)


class DirectBypassMatrixTests(APITestCase):
    def login(self, username):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": username, "password": PWD}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json()["data"]

    @classmethod
    def setUpTestData(cls):
        cls.pm_role = make_role("PM_X", ["projects.create", "projects.view", "articles.view"])
        cls.ed_role = make_role("ED_X", ["articles.create", "articles.update", "articles.view"])
        make_user("pm1", role=cls.pm_role, staff=True)
        make_user("ed1", role=cls.ed_role, staff=False)
        make_user("viewer1", role=make_role("VW_X", ["articles.view"]))

    def test_staff_without_codename_can_write(self):
        tokens = self.login("pm1")
        response = self.client.post(
            "/api/v1/articles/",
            {"title_fa": "x", "title_en": "x", "slug": "p23-pm",
             "description_fa": "x", "description_en": "x", "status": "draft"},
            format="json", HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_codename_without_staff_cannot_write(self):
        tokens = self.login("ed1")
        response = self.client.post(
            "/api/v1/articles/",
            {"title_fa": "x", "title_en": "x", "slug": "p23-ed",
             "description_fa": "x", "description_en": "x", "status": "draft"},
            format="json", HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_write_or_manage(self):
        tokens = self.login("viewer1")
        header = {"HTTP_AUTHORIZATION": f"Bearer {tokens['access']}"}
        payload = {"title_fa": "x", "title_en": "x", "slug": "p23-vw",
                   "description_fa": "x", "description_en": "x", "status": "published"}
        self.assertEqual(
            self.client.post("/api/v1/articles/", payload, format="json", **header).status_code,
            status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get("/api/v1/admin/users/", **header).status_code,
                         status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post("/api/v1/editorial/workflows/ensure/",
                             {"content_type": "articles.article", "object_id": 1},
                             format="json", **header).status_code,
            status.HTTP_403_FORBIDDEN)

    def test_profile_and_register_ignore_privilege_fields(self):
        tokens = self.login("viewer1")
        header = {"HTTP_AUTHORIZATION": f"Bearer {tokens['access']}"}
        response = self.client.patch(
            "/api/v1/auth/profile/",
            {"first_name": "H", "role": "SUPER_ADMIN", "is_staff": True, "is_superuser": True},
            format="json", **header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(username="viewer1")
        self.assertEqual(user.role.codename, "VW_X")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        response = self.client.post(
            "/api/v1/auth/register/",
            {"username": "p23attacker", "email": "p23attacker@hanahoush.local",
             "password": PWD, "confirm_password": PWD,
             "role": "SUPER_ADMIN", "is_staff": True, "is_superuser": True},
            format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        attacker = User.objects.get(username="p23attacker")
        self.assertFalse(attacker.is_staff)
        self.assertFalse(attacker.is_superuser)
