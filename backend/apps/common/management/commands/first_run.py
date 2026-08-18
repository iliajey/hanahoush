"""First-run provisioning command.

Runs ``doctor``, then (if the database is reachable) applies migrations,
bootstraps roles/permissions/demo users/superuser, and collects static files.
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from .doctor import run_checks


class Command(BaseCommand):
    help = "First-run setup: doctor → migrate → bootstrap → collectstatic."

    def handle(self, *args, **options):
        self.stdout.write("Hanahoush first-run setup")
        self.stdout.write("=" * 60)

        # 1. Doctor — diagnose the environment.
        checks = run_checks()
        db_check = next((c for c in checks if c["name"] == "Database connection"), None)
        db_ok = db_check is not None and db_check["status"] == "PASS"

        for check in checks:
            flag = check["status"]
            symbol = {"PASS": "[ OK ]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}[flag]
            self.stdout.write(f"  {symbol} {check['name'].ljust(22)} {check['detail']}")
        self.stdout.write("=" * 60)

        if not db_ok:
            raise CommandError(
                "Database is not reachable. Create the PostgreSQL user and database first — "
                "see docs/setup/local-development.md."
            )

        # 2. Apply migrations.
        self.stdout.write(self.style.SUCCESS("Applying migrations..."))
        call_command("migrate", interactive=False)

        # 3. Bootstrap roles / permissions / demo users / superuser.
        self.stdout.write(self.style.SUCCESS("Bootstrapping platform data..."))
        call_command("bootstrap")

        # 4. Collect static files (development-safe).
        self.stdout.write(self.style.SUCCESS("Collecting static files..."))
        call_command("collectstatic", interactive=False)

        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS(
            "First run complete. Start the backend with: python manage.py runserver"
        ))
        self.stdout.write(self.style.SUCCESS(
            "Start the frontend with: cd frontend && npm run dev"
        ))
