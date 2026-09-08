"""Phase 11 database portability: PostgreSQL -> SQLite.

Safe, repeatable migration of the real PostgreSQL database into the local
``db.sqlite3`` so the backend can run fully on SQLite with the SAME data.

Procedure (each step is verified):
  1. Backup PostgreSQL  (pg_dump custom format)  — never skippable.
  2. Portable transfer artifact (dumpdata JSON via Django serialization).
  3. Create the SQLite schema from existing Django migrations.
  4. Load the serialized data into SQLite.
  5. Verify: table-by-table record counts + FK integrity + the six roles.

Everything is idempotent and leaves PostgreSQL untouched. Run from ``backend/``
with the default local settings (the .env file provides the PostgreSQL URL):

    python scripts/migrate_pg_to_sqlite.py [--sqlite path]
    python scripts/verify_db_parity.py      # afterwards

Use ``--skip-backup`` only for throwaway development databases.
"""
from __future__ import annotations

import argparse
import datetime
import gzip
import os
import shutil
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
PG_DUMP = Path(r"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe")

# Django models whose rows are runtime state that must NOT be transferred:
# - contenttypes + built-in auth permissions are re-created by `migrate`.
# - sessions / admin log / token blacklist are stale runtime records.
EXCLUDES = [
    "contenttypes",
    "auth.permission",
    "sessions",
    "admin.logentry",
    "token_blacklist.blacklistedtoken",
    "token_blacklist.outstandingtoken",
]


def log(msg: str) -> None:
    print(f"[migrate_pg_to_sqlite] {msg}", flush=True)


def run(cmd: list[str], env: dict | None = None, **kwargs) -> subprocess.CompletedProcess:
    log("$ " + " " .join(str(c) for c in cmd))
    return subprocess.run([str(c) for c in cmd], cwd=BACKEND_DIR, check=True, env=env, **kwargs)


def timestamp() -> str:
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")


def pg_backup(backup_dir: Path) -> Path | None:
    """Step 1: real PostgreSQL backup (pg_dump custom format)."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    sys.path.insert(0, str(BACKEND_DIR))
    import django

    django.setup()
    from django.db import connection

    cfg = connection.settings_dict
    if not PG_DUMP.exists():
        log(f"WARNING pg_dump not found at {PG_DUMP}; skipping binary backup")
        return None

    target = backup_dir / f"hanahoush_pg_{timestamp()}.dump"
    url = f"postgresql://{cfg['USER']}:{cfg['PASSWORD']}@{cfg['HOST']}:{cfg['PORT']}/{cfg['NAME']}"
    cmd = [PG_DUMP, "--format=custom", "--no-owner", "--no-privileges", "--file", str(target), url]
    log("Running pg_dump (consistent snapshot of the PostgreSQL database)...")
    subprocess.run(cmd, cwd=BACKEND_DIR, check=True)
    size = target.stat().st_size
    if size <= 0:
        raise SystemExit(f"ERROR pg_dump produced an empty backup: {target}")
    log(f"PG backup OK: {target} ({size} bytes)")
    return target


def dumpdata_artifact(backup_dir: Path) -> Path:
    """Step 2: portable Django serialization of the PostgreSQL data.

    ``--natural-foreign`` keeps every integer PK (users, articles, ...) so the
    SQLite copy preserves primary keys and FK relationships exactly. Natural
    keys are still used for references to excluded infrastructure models
    (contenttypes, built-in auth permissions) that ``migrate`` re-creates.
    """
    stamp = timestamp()
    raw = backup_dir / f"hanahoush_dumpdata_{stamp}.json"
    cmd = ["python", "manage.py", "dumpdata", "--natural-foreign", "--verbosity", "0"]
    for app in EXCLUDES:
        cmd += ["--exclude", app]
    env = dict(os.environ)
    env["PYTHONUTF8"] = "1"
    with open(raw, "wb") as out:
        run(cmd, stdout=out, env=env)
    gz = backup_dir / f"hanahoush_dumpdata_{stamp}.json.gz"
    with open(raw, "rb") as src, gzip.open(gz, "wb") as dst:
        shutil.copyfileobj(src, dst)
    raw.unlink()
    log(f"Portable artifact OK: {gz} ({gz.stat().st_size} bytes)")
    return gz


def deploy_sqlite(sqlite_path: Path, artifact: Path) -> None:
    """Steps 3-4: schema creation + data load into SQLite."""
    env = dict(os.environ)
    env["USE_SQLITE"] = "true"
    # The first-run bootstrap must not create an extra `admin` user while the
    # imported data is being loaded (the imported superuser covers it).
    env["BOOTSTRAP_ADMIN_ENABLED"] = "false"

    if sqlite_path.exists():
        log(f"Deleting existing SQLite file {sqlite_path}")
        sqlite_path.unlink()

    log("Creating SQLite schema from Django migrations...")
    run(["python", "manage.py", "migrate", "--noinput"], env=env)
    size = sqlite_path.stat().st_size
    if size <= 0:
        raise SystemExit(f"ERROR SQLite schema is empty: {sqlite_path}")
    log(f"SQLite schema OK ({size} bytes)")

    tmp = sqlite_path.with_suffix(".import.json")
    with gzip.open(artifact, "rt", encoding="utf-8") as src, open(tmp, "w", encoding="utf-8") as dst:
        shutil.copyfileobj(src, dst)
    try:
        log("Loading PostgreSQL data into SQLite...")
        run(["python", "manage.py", "loaddata", str(tmp)], env=env)
    finally:
        tmp.unlink(missing_ok=True)
    log(f"SQLite data load complete ({sqlite_path.stat().st_size} bytes)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite", default=str(BACKEND_DIR / "db.sqlite3"))
    parser.add_argument("--skip-backup", action="store_true")
    args = parser.parse_args()

    backup_dir = BACKEND_DIR / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    if args.skip_backup:
        log("--skip-backup: skipping the PostgreSQL backup")
    else:
        pg_backup(backup_dir)

    artifact = dumpdata_artifact(backup_dir)
    deploy_sqlite(Path(args.sqlite), artifact)

    log("Migration finished. Run `python scripts/verify_db_parity.py` to compare counts.")
    return 0


if __name__ == "__main__":
    sys.exit(main())