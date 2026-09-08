import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
import django

django.setup()
from django.conf import settings

print("USE_SQLITE env:", os.environ.get("USE_SQLITE"))
print("settings DATABSES:", settings.DATABASES)
print("ERP_ENABLED:", settings.ERP_ENABLED)
print("ERP_PROVIDER:", settings.ERP_PROVIDER)
print("AUTH_USER_MODEL:", settings.AUTH_USER_MODEL)
print("REGISTRATION_DEFAULT_ROLE:", settings.REGISTRATION_DEFAULT_ROLE)
print("JWT:", settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME"), settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME"))
print("BOOTSTRAP_ADMIN_ENABLED:", getattr(settings, "BOOTSTRAP_ADMIN_ENABLED", "n/a"))
print("BOOTSTRAP_ADMIN_USERNAME:", getattr(settings, "BOOTSTRAP_ADMIN_USERNAME", "n/a"))

from django.db import connection

print("DB vendor:", connection.settings_dict["ENGINE"])
print("DB name:", connection.settings_dict["NAME"])

from django.contrib.auth import get_user_model

U = get_user_model()
print("users count:", U.objects.count())
print("superusers:", U.objects.filter(is_superuser=True).values_list("username", flat=True))
