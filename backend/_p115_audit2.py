from _p115 import *
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import get_hasher
User = get_user_model()
print("=== password check ===")
for u in User.objects.all():
    print(u.username, "| matches expected pw:", u.check_password("Admin@123456"))
print("=== hasher settings ===")
from django.conf import settings
print("PASSWORD_HASHERS:", settings.PASSWORD_HASHERS)
print("=== roles model ===")
import apps.accounts.models as am
print([n for n in dir(am) if n[0].isupper()])
