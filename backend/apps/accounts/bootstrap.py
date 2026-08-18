"""First-run bootstrap.

Creates the initial superuser automatically during startup, but ONLY when no
superuser exists yet. All values are configurable via environment variables
(see ``BOOTSTRAP_ADMIN_*`` in settings).
"""
import logging

from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


def ensure_superuser():
    """Create the bootstrap superuser if no superuser exists yet.

    Returns the created ``User`` or ``None`` when a superuser already exists
    or when the feature is disabled.
    """
    if not getattr(settings, "BOOTSTRAP_ADMIN_ENABLED", True):
        return None

    user_model = get_user_model()

    # Only bootstrap when the database is empty of superusers.
    if user_model.objects.filter(is_superuser=True).exists():
        return None

    username = settings.BOOTSTRAP_ADMIN_USERNAME
    email = settings.BOOTSTRAP_ADMIN_EMAIL
    password = settings.BOOTSTRAP_ADMIN_PASSWORD
    if not username or not password:
        logger.warning("Bootstrap superuser skipped: username/password not configured.")
        return None

    superuser = user_model.objects.create_superuser(
        username=username,
        email=email,
        password=password,
    )
    logger.info("Bootstrap: created initial superuser %r.", username)
    return superuser
