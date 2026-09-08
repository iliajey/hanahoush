"""Phase 11 database parity verification: PostgreSQL vs SQLite.

Compares table-by-table record counts between the PostgreSQL source database
and the local SQLite target, reports FK integrity for SQLite, and verifies the
six authoritative roles/users are intact.

Run from ``backend/``::

    python scripts/verify_db_parity.py [--sqlite path]
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

RESULTS: list[tuple[str, str, bool]] = []

# Runtime/stale tables intentionally NOT transferred (see migrate script).
# django_session + token blacklist hold live-session/token state that is
# meaningless after the transfer and must come from the new runtime.
EXPECTED_EXCLUDED = {"django_session", "token_blacklist_blacklistedtoken", "token_blacklist_outstandingtoken"}


def record(check: str, detail: str, ok: bool) -> None:
    RESULTS.append((check, detail, ok))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite", default=str(BACKEND_DIR / "db.sqlite3"))
    args = parser.parse_args()

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    sys.path.insert(0, str(BACKEND_DIR))
    import django
    from django.conf import settings

    django.setup()

    from django.db import connections

    # --- register the SQLite alias dynamically ---
    sqlite_path = Path(args.sqlite)
    if not sqlite_path.exists():
        raise SystemExit(f"SQLite file not found: {sqlite_path}")
    settings.DATABASES["sqlite_parity"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(sqlite_path),
        "USER": "",
        "PASSWORD": "",
        "HOST": "",
        "PORT": "",
        "OPTIONS": {},
        "TIME_ZONE": "UTC",
        "CONN_MAX_AGE": 0,
        "CONN_HEALTH_CHECKS": False,
        "ATOMIC_REQUESTS": False,
        "AUTOCOMMIT": True,
        "TEST": {},
    }

    pg = connections["default"]
    sq = connections["sqlite_parity"]

    def table_counts(conn, tables: list[str]) -> dict[str, int]:
        counts: dict[str, int] = {}
        with conn.cursor() as c:
            for t in tables:
                try:
                    c.execute(f'SELECT COUNT(*) FROM "{t}"')
                    counts[t] = c.fetchone()[0]
                except Exception as exc:  # pragma: no cover
                    counts[t] = -1
                    record(f"count {t}", f"error {exc}", False)
        return counts

    def pg_tables() -> list[str]:
        with pg.cursor() as c:
            c.execute(
                "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
            )
            return [r[0] for r in c.fetchall()]

    def sq_tables() -> list[str]:
        with sq.cursor() as c:
            c.execute(
                "SELECT name FROM sqlite_master WHERE type IN ('table','view') "
                "AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
            return [r[0] for r in c.fetchall()]

    pg_list = pg_tables()
    sq_list = sq_tables()

    print("== PostgreSQL source tables ==")
    pg_counts = table_counts(pg, pg_list)
    print(f"PostgreSQL tables: {len(pg_counts)}")

    print("== SQLite target tables ==")
    sq_counts = table_counts(sq, sq_list)
    print(f"SQLite tables: {len(sq_counts)}")

    print("\n== Record-count parity ==")
    total_missing = 0
    for t in sorted(set(pg_counts) & set(sq_counts)):
        p, s = pg_counts[t], sq_counts[t]
        if t in EXPECTED_EXCLUDED:
            record(f"excluded {t}", f"pg={p} sqlite={s} (documented exclusion)", True)
            print(f"  EXCLUDED {t:37s} pg={p:<6d} sqlite={s:<6d} (runtime state, not copied)")
            continue
        ok = p == s
        if not ok:
            total_missing += 1
        record(
            f"parity {t}",
            f"pg={p} sqlite={s} {'OK' if ok else 'MISMATCH'}",
            ok,
        )
        flag = "OK" if ok else "MISMATCH"
        print(f"  {flag:8s} {t:45s} pg={p:<6d} sqlite={s:<6d}")

    missing_in_sqlite = [t for t in pg_list if t not in sq_list]
    extra_in_sqlite = [t for t in sq_list if t not in pg_list]
    record("sqlite missing tables", ",".join(missing_in_sqlite) or "none", not missing_in_sqlite)
    record("sqlite extra tables", ",".join(extra_in_sqlite) or "none", not extra_in_sqlite)
    print("\nSQLite missing tables:", missing_in_sqlite or "none")
    print("SQLite extra tables:", extra_in_sqlite or "none")

    print("\n== SQLite FK integrity ==")
    with sq.cursor() as c:
        c.execute("PRAGMA foreign_key_check")
        violations = list(c.fetchall())
    record("fk integrity", f"{len(violations)} violations", not violations)
    print(f"FK violations: {len(violations)}")
    for v in violations[:10]:
        print("   ", v)

    print("\n== Auth/RBAC integrity (SQLite) ==")
    from apps.accounts.models import Permission, Role, User

    expected_roles = [
        "SUPER_ADMIN",
        "COMPANY_ADMIN",
        "CONTENT_MANAGER",
        "PROJECT_MANAGER",
        "EDITOR",
        "VIEWER",
    ]
    actual_roles = list(Role.objects.using("sqlite_parity").values_list("codename", flat=True))
    roles_ok = set(expected_roles) <= set(actual_roles)
    record("roles intact", f"expected {len(expected_roles)} got {len(actual_roles)}", roles_ok)
    print(f"Roles present (need all 6): {sorted(actual_roles)} -> {'OK' if roles_ok else 'FAIL'}")

    expected_users = ["superadmin", "companyadmin", "contentmanager", "projectmanager", "editor", "viewer"]
    actual_users = list(User.objects.using("sqlite_parity").values_list("username", flat=True))
    users_ok = set(expected_users) <= set(actual_users)
    record("users intact", f"expected {len(expected_users)} got {len(actual_users)}", users_ok)
    print(f"Users present (need all 6): {sorted(actual_users)} -> {'OK' if users_ok else 'FAIL'}")

    superuser = User.objects.using("sqlite_parity").filter(is_superuser=True).first()
    record("django superuser", str(superuser) if superuser else "MISSING", superuser is not None)
    print(f"Django superuser: {superuser}")

    perm_count = Permission.objects.using("sqlite_parity").count()
    record("permission catalog", f"{perm_count} permissions", perm_count >= 27)
    print(f"Custom permission catalog: {perm_count}")

    # Password hashes must be portable hashes (never empty / plaintext).
    hashes = list(User.objects.using("sqlite_parity").values_list("password", flat=True))
    safe = all(h and not h.startswith(("superadmin123", "Password", "Admin@")) for h in hashes)
    record("password hashes portable", f"{len(hashes)} hashes", safe)
    print(f"Portable password hashes: {len(hashes)} -> {'OK' if safe else 'FAIL'}")

    total_pg = sum(v for t, v in pg_counts.items() if v > 0 and t not in EXPECTED_EXCLUDED)
    total_sq = sum(v for t, v in sq_counts.items() if v > 0 and t not in EXPECTED_EXCLUDED)
    record("total rows", f"pg={total_pg} sqlite={total_sq}", total_pg == total_sq)
    print(f"\nTOTAL rows: postgres={total_pg} sqlite={total_sq}")

    failed = [r for r in RESULTS if not r[2]]
    print(f"\nSUMMARY: {len(RESULTS)} checks, {len(failed)} failed")
    for check, detail, _ in failed:
        print(f"  FAILED {check}: {detail}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())