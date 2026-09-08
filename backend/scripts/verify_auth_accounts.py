"""Phase 11.5 HTTP-level authentication verification.

Exercises the REAL API consumed by the frontend (no ORM shortcuts):
login → JWT validity → /auth/me/ (username, role, permissions, staff,
superuser) → dashboard authorization → logout → post-logout access.

The password is read from the environment (``DEMO_USERS_PASSWORD`` falling
back to ``BOOTSTRAP_ADMIN_PASSWORD``) and never printed or logged.

Run from the backend directory with the dev server up:

    python scripts/verify_auth_accounts.py
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

BASE = os.environ.get("HH_VERIFY_BASE", "http://127.0.0.1:8000/api/v1")

# Authorization expectations derived from the backend RBAC (apps/accounts).
STAFF_ROLES = {"SUPER_ADMIN", "COMPANY_ADMIN", "CONTENT_MANAGER", "PROJECT_MANAGER"}
SUPERUSER_ACCOUNTS = {"superadmin", "admin"}

ACCOUNTS = [
    ("superadmin", "SUPER_ADMIN"),
    ("companyadmin", "COMPANY_ADMIN"),
    ("contentmanager", "CONTENT_MANAGER"),
    ("projectmanager", "PROJECT_MANAGER"),
    ("editor", "EDITOR"),
    ("viewer", "VIEWER"),
    ("admin", None),  # Django superuser; role asserted from /auth/me
]

results = []


def record(check: str, expected: str, actual: str, ok: bool) -> None:
    results.append((check, expected, actual, ok))
    print(f"  [{'PASS' if ok else 'FAIL'}] {check}: expected={expected} actual={actual}")


def request(method: str, path: str, token: str | None = None, payload: dict | None = None):
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
    except urllib.error.URLError:
        return 0, {}


def main() -> int:
    import django

    django.setup()

    from apps.accounts.seeders import demo_user_password

    password = os.environ.get("DEMO_USERS_PASSWORD", "") or demo_user_password()
    if not password:
        print("ERROR: set DEMO_USERS_PASSWORD to run login verification.")
        return 2

    for username, expected_role in ACCOUNTS:
        print(f"\n== {username} ==")
        # Backend authority: seeders mark the four management roles as staff;
        # dashboard API (IsStaffOrAdmin) admits staff/superuser accounts.
        is_staff_expected = username in {"superadmin", "admin", "companyadmin", "contentmanager", "projectmanager"}
        is_superuser_expected = username in SUPERUSER_ACCOUNTS
        dashboard_expected = "200" if is_staff_expected else "403"

        # 1. Login issues tokens.
        status, body = request("POST", "/auth/login/", None, {"username": username, "password": password})
        ok = status == 200 and body.get("data")
        record("login", "200 + access/refresh/user", str(status), ok)
        if not ok:
            continue
        token = body["data"].get("access")
        refresh = body["data"].get("refresh")
        user = body["data"].get("user") or {}

        # 2-8. /auth/me/ correctness.
        status, me = request("GET", "/auth/me/", token)
        data = me.get("data") or {}
        record("/auth/me/ succeeds", "200", str(status), status == 200)
        record("username", username, str(data.get("username")), data.get("username") == username)
        if expected_role:
            record("role", expected_role, str((data.get("role") or {}).get("codename")),
                   (data.get("role") or {}).get("codename") == expected_role)
        perms = data.get("permissions") or []
        record("permissions resolved", ">=1", str(len(perms)), len(perms) > 0)
        record("is_staff", str(is_staff_expected),
               str(data.get("is_staff")), data.get("is_staff") == is_staff_expected)
        record("is_superuser", str(is_superuser_expected),
               str(data.get("is_superuser")), data.get("is_superuser") == is_superuser_expected)
        record("no password/hash in /me", "absent",
               "present" if ("password" in data) else "absent", "password" not in data)

        # 9. Dashboard authorization matches role.
        status, _ = request("GET", "/admin/dashboard/", token)
        record("dashboard access", dashboard_expected, str(status), str(status) == dashboard_expected)

        # 10. Logout blacklists the refresh token.
        status, _ = request("POST", "/auth/logout/", token, {"refresh": refresh})
        record("logout", "200", str(status), status == 200)

        # 11. Post-logout: refresh rejected; unauthenticated request rejected.
        status, _ = request("POST", "/auth/refresh/", None, {"refresh": refresh})
        record("refresh after logout", "401", str(status), status == 401)
        status, _ = request("GET", "/auth/me/", None)
        record("/auth/me/ without token", "401", str(status), status == 401)

    # Wrong password must never authenticate (single negative probe per run).
    print("\n== negative probe ==")
    status, _ = request("POST", "/auth/login/", None, {"username": "viewer", "password": "definitely-wrong-pw"})
    record("login with wrong password", "401", str(status), status == 401)

    failed = [r for r in results if not r[3]]
    print(f"\nTOTAL {len(results)} checks, {len(failed)} failed")
    for check, expected, actual, _ in failed:
        print(f"  FAILED: {check} expected {expected} got {actual}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
