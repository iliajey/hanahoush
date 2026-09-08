"""Phase 9G live six-role verification (HTTP-level, real server).

Verifies login, role resolution, dashboard/route/action authorization and
logout for the six seeded demo accounts WITHOUT printing passwords. Credentials
are read directly from the seeder (never logged).

Run inside the backend directory with a running server:
    python scripts/verify_six_roles.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

BASE = os.environ.get("HH_VERIFY_BASE", "http://127.0.0.1:8000/api/v1")

STAFF_ROLES = {"SUPER_ADMIN", "COMPANY_ADMIN", "CONTENT_MANAGER", "PROJECT_MANAGER"}
MANAGE_ROLES = {"SUPER_ADMIN", "COMPANY_ADMIN", "CONTENT_MANAGER"}

results = []


def record(check: str, expected: str, actual: str, ok: bool) -> None:
    results.append((check, expected, actual, ok))
    print(f"  [{'PASS' if ok else 'FAIL'}] {check}: expected={expected} actual={actual}")


def request(method: str, path: str, token: str | None = None, payload: dict | None = None) -> tuple[int, dict]:
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode()
            try:
                return resp.status, json.loads(body)
            except json.JSONDecodeError:
                return resp.status, {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        try:
            return exc.code, json.loads(body)
        except json.JSONDecodeError:
            return exc.code, {}


def main() -> int:
    import django

    django.setup()

    # Credentials are read here and NEVER printed.
    from apps.accounts.seeders import DEMO_USERS, demo_user_password

    password = os.environ.get("DEMO_USERS_PASSWORD", "") or demo_user_password()
    if not password:
        print("ERROR: set DEMO_USERS_PASSWORD (or BOOTSTRAP_ADMIN_PASSWORD) to verify logins.")
        return 2

    # Warm up: resolve one article id for workflow ensure tests (public read).
    status, body = request("GET", "/articles/?page_size=1", None)
    article_id = None
    if status == 200 and body.get("data"):
        article_id = body["data"][0]["id"]
    print(f"INFO article for workflow tests: id={article_id} (list status={status})")

    for username, definition in DEMO_USERS.items():
        expected_role = definition["role"]
        print(f"\n== {username} (role {expected_role}) ==")

        # 1. Login
        status, body = request("POST", "/auth/login/", None, {"username": username, "password": password})
        token = None
        refresh = None
        if status == 200 and body.get("data"):
            token = body["data"].get("access")
            refresh = body["data"].get("refresh")
            role_code = body["data"]["user"].get("role", {}).get("codename")
            record("login", f"200 + role {expected_role}", f"{status} + {role_code}", status == 200 and role_code == expected_role)
        else:
            record("login", "200", str(status), status == 200)
            continue

        # 2. /auth/me — role + permissions resolution
        status, body = request("GET", "/auth/me/", token)
        me_role = body.get("data", {}).get("role", {}).get("codename") if body.get("data") else None
        perms = body.get("data", {}).get("permissions", []) if body.get("data") else []
        record("auth/me role", expected_role, str(me_role), status == 200 and me_role == expected_role)
        record("auth/me permissions", ">=1 codename", str(len(perms)), status == 200 and len(perms) > 0)

        # 3. Dashboard API (staff-only IsStaffOrAdmin)
        status, _ = request("GET", "/admin/dashboard/", token)
        expected = "200" if expected_role in STAFF_ROLES else "403"
        record("admin/dashboard", expected, str(status), status == (200 if expected_role in STAFF_ROLES else 403))

        # 4. Editorial list (editorial.view → all six roles)
        status, _ = request("GET", "/editorial/workflows/", token)
        record("editorial/workflows", "200", str(status), status == 200)

        # 5. Media library (DRF IsAdminUser = is_staff)
        status, _ = request("GET", "/media/", token)
        expected = "200" if expected_role in STAFF_ROLES else "403"
        record("media list", expected, str(status), status == (200 if expected_role in STAFF_ROLES else 403))

        # 6. Admin contact (staff-only)
        status, _ = request("GET", "/admin/contact/", token)
        expected = "200" if expected_role in STAFF_ROLES else "403"
        record("admin/contact", expected, str(status), status == (200 if expected_role in STAFF_ROLES else 403))

        # 7. Admin newsletter (staff-only)
        status, _ = request("GET", "/admin/newsletter/", token)
        expected = "200" if expected_role in STAFF_ROLES else "403"
        record("admin/newsletter", expected, str(status), status == (200 if expected_role in STAFF_ROLES else 403))

        # 8. Forbidden/protected action: editorial ensure requires editorial.manage
        if article_id is not None:
            status, _ = request(
                "POST",
                "/editorial/workflows/ensure/",
                token,
                {"content_type": "articles.article", "object_id": article_id},
            )
            expected = "200" if expected_role in MANAGE_ROLES else "403"
            record("editorial ensure (action)", expected, str(status), status == (200 if expected_role in MANAGE_ROLES else 403))
        else:
            record("editorial ensure (action)", "skipped", "no article", True)

        # 9. Staff write surface: media upload endpoint reachability
        status, _ = request("POST", "/media/", token, {})
        if expected_role in STAFF_ROLES:
            record("media upload gate", "400 (staff, validation)", str(status), status == 400)
        else:
            record("media upload gate", "403 (non-staff)", str(status), status in (401, 403))

        # 10. Logout (refresh blacklisted)
        status, _ = request("POST", "/auth/logout/", token, {"refresh": refresh})
        record("logout", "200", str(status), status == 200)

    # 11. Anonymous checks
    print("\n== anonymous ==")
    status, _ = request("GET", "/articles/", None)
    record("public articles", "200", str(status), status == 200)
    status, _ = request("GET", "/admin/dashboard/", None)
    record("anonymous dashboard", "401", str(status), status in (401, 403))
    status, _ = request("GET", "/auth/me/", None)
    record("anonymous /auth/me", "401", str(status), status in (401, 403))

    failed = [r for r in results if not r[3]]
    print(f"\nTOTAL {len(results)} checks, {len(failed)} failed")
    if failed:
        for check, expected, actual, _ in failed:
            print(f"  FAILED: {check} expected {expected} got {actual}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
