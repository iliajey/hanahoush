"""Verify development auth accounts are healthy (Phase 12, Part H).

Read-only: checks each expected account exists with the right role, staff
flags, active status and a usable password. NEVER prints passwords.
"""
from django.contrib.auth import authenticate, get_user_model
from django.core.management.base import BaseCommand

from apps.accounts.seeders import DEMO_USERS

User = get_user_model()

EXPECTED_SUPERUSER = "admin"


class Command(BaseCommand):
    help = (
        "Verify the development auth accounts exist, hold the right role "
        "and can authenticate. Never prints passwords."
    )

    def handle(self, *args, **options):
        failures: list[str] = []
        checked = 0
        for username, definition in sorted(DEMO_USERS.items()):
            checked += 1
            try:
                user = User.objects.select_related("role").get(username=username)
            except User.DoesNotExist:
                failures.append(f"{username}: missing account")
                continue
            role = user.role.codename if user.role else None
            problems = []
            if role != definition["role"]:
                problems.append(f"role={role!r} expected {definition['role']!r}")
            if not user.is_active:
                problems.append("inactive")
            if username == "superadmin" and not user.is_superuser:
                problems.append("not a superuser")
            if not user.has_usable_password():
                problems.append("no usable password")
            if problems:
                failures.append(f"{username}: " + ", ".join(problems))
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{username}: ok (role={role}, "
                        f"staff={user.is_staff}, superuser={user.is_superuser})"
                    )
                )
        try:
            admin = User.objects.get(username=EXPECTED_SUPERUSER)
            checked += 1
            if not admin.is_superuser or not admin.is_active:
                failures.append(f"{EXPECTED_SUPERUSER}: not an active superuser")
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"{EXPECTED_SUPERUSER}: ok (django superuser)")
                )
        except User.DoesNotExist:
            failures.append(f"{EXPECTED_SUPERUSER}: missing account")

        # ORM-level authentication probe (no passwords involved).
        for username in sorted(DEMO_USERS):
            user = authenticate(username=username, password=None)
            if user is not None:  # pragma: no cover - None password never authenticates
                failures.append(f"{username}: unexpected authenticate() success")

        if failures:
            for failure in failures:
                self.stdout.write(self.style.ERROR(f"FAIL {failure}"))
            self.stdout.write(self.style.ERROR(f"{len(failures)}/{checked} account checks failed."))
            raise SystemExit(1)
        self.stdout.write(self.style.SUCCESS(f"All {checked} account checks passed."))
