import sqlite3

DB = r"E:\Ilia Jamali\prog\hanahoush\backend\db.sqlite3"
c = sqlite3.connect(DB)
c.row_factory = sqlite3.Row

print("=== TABLES (non-sqlite) ===")
for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'django_%' ORDER BY name"):
    print(" ", r[0])

print("\n=== accounts_user ===")
for r in c.execute("SELECT id,username,email,first_name,last_name,phone,role_id,is_active,is_staff,is_superuser,date_joined FROM accounts_user ORDER BY id"):
    print(dict(r))

print("\n=== accounts_role ===")
for r in c.execute("SELECT id,name,codename,description,is_system FROM accounts_role ORDER BY id"):
    print(dict(r))

print("\n=== role permissions (m2m) ===")
for r in c.execute("SELECT role_id, permission_id FROM accounts_role_permissions ORDER BY role_id"):
    print(dict(r))

print("\n=== accounts_permission ===")
for r in c.execute("SELECT id,name,codename,module,description FROM accounts_permission ORDER BY module, name"):
    print(dict(r))

print("\n=== counts ===")
for t in ["accounts_user", "accounts_role", "accounts_permission", "accounts_role_permissions", "editorial_editorialcontent", "articles_article", "projects_project", "services_service", "company_companyinfo", "page_builder_page", "media_library_media"]:
    try:
        n = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"  {t}: {n}")
    except Exception as e:
        print(f"  {t}: ERROR {e}")
