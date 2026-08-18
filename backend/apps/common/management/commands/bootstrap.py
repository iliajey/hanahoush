from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Bootstraps the platform: applies migrations, creates default "
        "permissions, roles, demo users, and a superuser if missing."
    )

    def handle(self, *args, **options):
        # 1. Apply migrations if needed.
        call_command("migrate", interactive=False)
        self.stdout.write(self.style.SUCCESS("Migrations applied."))

        # 2. Default permissions.
        from apps.accounts.seeders import seed_permissions

        permissions = seed_permissions()
        self.stdout.write(self.style.SUCCESS(f"Permissions ensured ({permissions.count()} total)."))

        # 3. Default roles.
        from apps.accounts.seeders import seed_roles

        roles = seed_roles()
        self.stdout.write(self.style.SUCCESS(f"Roles ensured ({len(roles)} total)."))

        # 4. Demo users.
        from apps.accounts.seeders import seed_demo_users

        users = seed_demo_users()
        self.stdout.write(self.style.SUCCESS(f"Demo users ensured ({len(users)} total)."))

        # 5. Superuser (no-op if one already exists).
        from apps.accounts.bootstrap import ensure_superuser

        if ensure_superuser():
            self.stdout.write(self.style.SUCCESS("Superuser created."))
        else:
            self.stdout.write("Superuser already exists.")

        # 6. Demo content (idempotent) — only counts newly created records.
        from apps.common.seed import demo_author, seed_demo_data

        if demo_author() is not None:
            counts = seed_demo_data()
            total = sum(counts.values())
            detail = ", ".join(f"{key}={value}" for key, value in counts.items() if value)
            if total:
                self.stdout.write(self.style.SUCCESS(f"Demo content seeded ({detail})."))
            else:
                self.stdout.write("Demo content already present.")

        # 7. Page-builder data (idempotent) — section registry, navigation,
        #    footer, announcement, hero, SEO and the composed "home" page.
        from apps.page_builder.seed import seed_page_builder

        counts = seed_page_builder()
        total = sum(counts.values())
        detail = ", ".join(f"{key}={value}" for key, value in counts.items() if value)
        if total:
            self.stdout.write(self.style.SUCCESS(f"Page builder seeded ({detail})."))
        else:
            self.stdout.write("Page builder data already present.")

        # 8. Editorial workflow stage definitions (idempotent).
        from apps.editorial.seed import seed_workflow_stages

        created_stages = seed_workflow_stages()
        self.stdout.write(self.style.SUCCESS(f"Workflow stages ensured ({created_stages} created)."))

        self.stdout.write(self.style.SUCCESS("Bootstrap complete."))
