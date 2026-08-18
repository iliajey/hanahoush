"""Settings loader.

Selecting a settings module:
- local:      ``DJANGO_SETTINGS_MODULE=config.settings.local``  (default, via manage.py)
- production: ``DJANGO_SETTINGS_MODULE=config.settings.production``
- ci:         ``DJANGO_SETTINGS_MODULE=config.settings.ci``
"""
