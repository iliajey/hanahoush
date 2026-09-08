from _p115 import *
from django.contrib.auth import get_user_model
User = get_user_model()
print("User model:", User.__name__, "| table:", User._meta.db_table, "| app:", User._meta.app_label)
print("Total users:", User.objects.count())
for u in User.objects.all().order_by("id"):
    print(f"id={u.id} username={u.username!r} email={u.email!r} active={u.is_active} staff={u.is_staff} super={u.is_superuser}")
    print(f"    pw={u.password[:70]}")
    print(f"    names={u.first_name!r}/{u.last_name!r} phone={getattr(u,'phone','-')!r} last_login={u.last_login}")
    if hasattr(u, "role"):
        print(f"    role={getattr(u,'role')!r}")
    if hasattr(u, "roles"):
        print(f"    roles_rel={[str(r) for r in getattr(u,'roles').all()]}")
    print(f"    groups={[g.name for g in u.groups.all()]}")
