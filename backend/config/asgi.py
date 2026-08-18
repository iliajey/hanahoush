"""ASGI config for the Hanahoush backend.

Serves HTTP via Django and is ready for WebSocket protocols
(e.g. Channels) in a later phase.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_asgi_application()
