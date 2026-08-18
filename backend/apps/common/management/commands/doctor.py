"""Environment `doctor` command.

Runs a battery of local-development checks and reports PASS / FAIL / SKIP for
each. Exits non-zero if any required check fails.
"""
import os
import platform
import shutil
from pathlib import Path

import django

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

OK = "PASS"
BAD = "FAIL"
SKIP = "SKIP"


def run_checks() -> list[dict]:
    """Return a list of ``{name, status, detail}`` diagnostics."""
    checks: list[dict] = []

    # --- Python ------------------------------------------------------------
    py = tuple(int(x) for x in platform.python_version_tuple())
    checks.append(
        {
            "name": "Python version",
            "status": OK if py >= (3, 10) else BAD,
            "detail": platform.python_version(),
        }
    )

    # --- Django ------------------------------------------------------------
    dj = django.get_version()
    checks.append(
        {
            "name": "Django version",
            "status": OK if dj.startswith("5.") else BAD,
            "detail": dj,
        }
    )

    # --- Environment variables ---------------------------------------------
    db_url = os.environ.get("DATABASE_URL", "")
    checks.append(
        {
            "name": "DATABASE_URL",
            "status": OK if db_url else BAD,
            "detail": "set" if db_url else "(missing — copy .env.example to .env)",
        }
    )
    secret = settings.SECRET_KEY
    checks.append(
        {
            "name": "DJANGO_SECRET_KEY",
            "status": OK if secret and "insecure-dev-key-change-me" not in secret else BAD,
            "detail": "set" if secret else "(missing)",
        }
    )

    # --- Database configuration + connection --------------------------------
    cfg = settings.DATABASES.get("default", {})
    engine = cfg.get("ENGINE", "").rsplit(".", 1)[-1]
    checks.append(
        {
            "name": "Database engine",
            "status": OK if engine == "postgresql" else BAD,
            "detail": f"{engine} @ {cfg.get('HOST', '?')}:{cfg.get('PORT', '?')} db={cfg.get('NAME', '?')} user={cfg.get('USER', '?')}",
        }
    )
    db_ok = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks.append({"name": "Database connection", "status": OK, "detail": "connected"})
        db_ok = True
    except Exception as exc:  # noqa: BLE001
        checks.append(
            {
                "name": "Database connection",
                "status": BAD,
                "detail": f"{type(exc).__name__}: {str(exc)[:160]}",
            }
        )
        db_ok = False

    # --- Folders -----------------------------------------------------------
    media_root = Path(settings.MEDIA_ROOT)
    media_root.mkdir(parents=True, exist_ok=True)
    checks.append(
        {
            "name": "Media folder",
            "status": OK if os.access(media_root, os.W_OK | os.X_OK) else BAD,
            "detail": str(media_root),
        }
    )

    static_root = Path(settings.STATIC_ROOT)
    static_parent = static_root.parent
    static_root.mkdir(parents=True, exist_ok=True)
    checks.append(
        {
            "name": "Static folder",
            "status": OK if os.access(static_root, os.W_OK | os.X_OK) or os.access(static_parent, os.W_OK) else BAD,
            "detail": str(static_root),
        }
    )

    # --- Migration status ----------------------------------------------------
    if db_ok:
        from django.db.migrations.executor import MigrationExecutor

        executor = MigrationExecutor(connection)
        plan = executor.migration_plan([])
        if plan:
            checks.append(
                {
                    "name": "Migrations status",
                    "status": BAD,
                    "detail": f"{len(plan)} migration(s) pending — run `python manage.py migrate`",
                }
            )
        else:
            checks.append({"name": "Migrations status", "status": OK, "detail": "up to date"})
    else:
        checks.append({"name": "Migrations status", "status": SKIP, "detail": "db unreachable"})

    # --- psql availability (helpful for setup) ------------------------------
    checks.append(
        {
            "name": "psql client",
            "status": OK if shutil.which("psql") else SKIP,
            "detail": shutil.which("psql") or "not on PATH (optional)",
        }
    )

    # --- Redis (future / optional) ------------------------------------------
    redis_url = os.environ.get("REDIS_URL")
    if redis_url:
        try:
            import redis  # type: ignore

            conn = redis.from_url(redis_url)
            conn.ping()
            checks.append({"name": "Redis", "status": OK, "detail": redis_url})
        except Exception as exc:  # noqa: BLE001
            checks.append({"name": "Redis", "status": BAD, "detail": str(exc)[:120]})
    else:
        checks.append({"name": "Redis", "status": SKIP, "detail": "REDIS_URL not set (optional)"})

    return checks


class Command(BaseCommand):
    help = "Diagnose the local development environment."

    def handle(self, *args, **options):
        checks = run_checks()
        self.stdout.write("Hanahoush environment doctor")
        self.stdout.write("=" * 60)
        failed = 0
        for check in checks:
            flag = check["status"]
            if flag == BAD:
                failed += 1
            symbol = {"PASS": "[ OK ]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}[flag]
            self.stdout.write(f"  {symbol} {check['name'].ljust(22)} {check['detail']}")
        self.stdout.write("=" * 60)
        passed = sum(1 for c in checks if c["status"] == OK)
        skipped = sum(1 for c in checks if c["status"] == SKIP)
        self.stdout.write(f"doctor: {passed} passed, {failed} failed, {skipped} skipped.")
        if failed:
            raise CommandError(f"{failed} check(s) failed — see details above.")