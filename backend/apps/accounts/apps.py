import logging
import warnings

from django.apps import AppConfig
from django.db.utils import DatabaseError

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Accounts"

    def ready(self):
        """Run the first-run superuser bootstrap during startup.

        Only creates a superuser when none exists. The database query during
        app initialization is intentionally wrapped so the "Accessing the
        database during app initialization" RuntimeWarning does not pollute
        logs, and DatabaseError is swallowed because ``ready()`` also fires
        while migrations are still being applied.
        """
        try:
            from .bootstrap import ensure_superuser

            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message="Accessing the database during app initialization is discouraged",
                )
                ensure_superuser()
        except DatabaseError:
            # Expected while migrations are still being applied on first run.
            logger.debug("Bootstrap skipped: database not ready (migrations pending).")
        except Exception:  # pragma: no cover - defensive, never block startup
            logger.warning("Bootstrap superuser creation failed.", exc_info=True)
