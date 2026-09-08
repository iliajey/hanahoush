from _p115 import *
from django.contrib.auth import get_user_model
User = get_user_model()
candidates = ["SuperAdmin@123456","CompanyAdmin@123456","ContentManager@123456","ProjectManager@123456","Editor@123456","Viewer@123456","Admin@123456"]
for u in User.objects.all():
    matches = [c for c in candidates if u.check_password(c)]
    print(f"{u.username}: matches={matches or 'NONE'}")
print("superusers:", list(User.objects.filter(is_superuser=True).values_list("username", flat=True)))
print("users with username=admin:", list(User.objects.filter(username__iexact="admin").values_list("username", flat=True)))
from apps.accounts.models import Role, Permission
print("roles:", [(r.codename, r.is_system, r.permissions.count()) for r in Role.objects.all()])
print("permissions:", Permission.objects.count())
