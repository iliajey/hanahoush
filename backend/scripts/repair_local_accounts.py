"""Repair local development accounts (Phase 11.5).

Ensures the six application roles, the six demo accounts and the Django
superuser (``BOOTSTRAP_ADMIN_USERNAME``, default ``admin``) exist with the
correct roles and flags, optionally resetting their passwords.

Security rules honored by this script:
- The password is NEVER embedded in source code. It must be supplied via the
  ``REPAIR_PASSWORD`` environment variable (or piped to stdin).
- Passwords are stored exclusively through Django's password hashing
  (``set_password``); the plaintext is never printed, logged or serialized.
- Existing CMS/content data is untouched; only accounts/roles are written.

Usage (from the backend directory):

    REPAIR_PASSWORD=... python scripts/repair_local_accounts.py
    # or: echo ... | python scripts/repair_local_accounts.py --stdin

Add ``--check-only`` to report the current state without writing anything.
"""
import argparse
import getpass
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")


def read_password(via_stdin: bool) -> str:
    """Read the password from the environment or stdin — never hardcode it."""
    if via_stdin:
        return getpass.getpass("New password for local accounts: ")
    return os.environ.get("REPAIR_PASSWORD", "")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stdin", action="store_true", help="read password from stdin prompt")
    parser.add_argument(
        "--check-only", action="store_true", help="report state without writing anything"
    )
    args = parser.parse_args()

    import django

    django.setup()

    from django.contrib.auth import get_user_model

    from apps.accounts.seeders import DEMO_USERS, STAFF_USERS, demo_user_password, seed_permissions, seed_roles

    User = get_user_model()
    password = read_password(args.stdin) or demo_user_password()
    changed: list[str] = []
    problems: list[str] = []

    # 1. Permission catalog + roles (idempotent).
    if not args.check_only:
        seed_permissions()
        roles = seed_roles()
        roles_by_codename = {r.codename: r for r in roles}
    else:
        from apps.accounts.models import Role

        roles_by_codename = {r.codename: r for r in Role.objects.all()}

    # 2. Six demo accounts: existence, role, flags, password.
    for username, definition in DEMO_USERS.items():
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            if args.check_only:
                problems.append(f"{username}: MISSING")
                continue
            user = User.objects.create(
                username=username,
                email=definition["email"],
                first_name=definition["first_name"],
                last_name=definition["last_name"],
            )
            changed.append(f"{username}: created")

        role = roles_by_codename.get(definition["role"])
        updates: list[str] = []
        if user.role_id != (role.id if role else None):
            if not args.check_only and role:
                user.role = role
                updates.append("role")
            else:
                problems.append(f"{username}: role != {definition['role']}")
        expected_staff = username in STAFF_USERS or username == "superadmin"
        if user.is_staff != expected_staff:
            if not args.check_only:
                user.is_staff = expected_staff
                updates.append("is_staff")
            else:
                problems.append(f"{username}: is_staff={user.is_staff} expected {expected_staff}")
        if username == "superadmin" and not user.is_superuser:
            if not args.check_only:
                user.is_superuser = True
                updates.append("is_superuser")
            else:
                problems.append("superadmin: is_superuser=False")
        if not user.is_active:
            if not args.check_only:
                user.is_active = True
                updates.append("is_active")
            else:
                problems.append(f"{username}: is_active=False")
        if password:
            if args.check_only:
                if not user.check_password(password):
                    problems.append(f"{username}: password mismatch")
            else:
                user.set_password(password)
                updates.append("password")
        elif not user.has_usable_password() and not args.check_only:
            problems.append(f"{username}: no password configured (set REPAIR_PASSWORD)")
        if not args.check_only and updates:
            user.save()
            changed.append(f"{username}: {', '.join(updates)}")

    # 3. Django superuser (default username: admin).
    su_username = os.environ.get("BOOTSTRAP_ADMIN_USERNAME", "admin")
    su_email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "admin@hanahoush.local")
    try:
        su = User.objects.get(username=su_username)
    except User.DoesNotExist:
        if args.check_only:
            problems.append(f"{su_username}: MISSING (Django superuser)")
            su = None
        else:
            if not password:
                print("ERROR: no password available (REPAIR_PASSWORD); superuser not created.")
                return 2
            su = User.objects.create_superuser(
                username=su_username, email=su_email, password=password
            )
            super_admin_role = roles_by_codename.get("SUPER_ADMIN")
            if super_admin_role:
                su.role = super_admin_role
            su.save()
            changed.append(f"{su_username}: created (superuser)")

    if su is not None:
        fixes = []
        if not su.is_superuser:
            problems.append(f"{su_username}: is_superuser=False")
        if not su.is_active:
            problems.append(f"{su_username}: is_active=False")
        if not args.check_only:
            if not su.is_superuser:
                su.is_superuser = True
                fixes.append("is_superuser")
            if not su.is_staff:
                su.is_staff = True
                fixes.append("is_staff")
            if not su.is_active:
                su.is_active = True
                fixes.append("is_active")
            if password and not su.check_password(password):
                su.set_password(password)
                fixes.append("password")
            if fixes:
                su.save()
                changed.append(f"{su_username}: {', '.join(fixes)}")

    # 4. Summary (never prints the password itself).
    print("\n=== repair summary ===")
    print(f"mode: {'CHECK ONLY' if args.check_only else 'WRITE'}")
    for entry in changed:
        print(f"  changed: {entry}")
    for problem in problems:
        print(f"  problem: {problem}")
    total = User.objects.count()
    superusers = list(User.objects.filter(is_superuser=True).values_list("username", flat=True))
    print(f"users total: {total} | superusers: {superusers}")
    if args.check_only:
        print("check-only result:", "OK" if not problems else f"{len(problems)} problem(s)")
        return 0 if not problems else 1
    print("repair:", "OK" if not problems else "completed with problems")
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
