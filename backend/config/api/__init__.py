"""Base API package for Hanahoush.

URL routing lives in ``config.api.urls`` (not here) so that importing this
package does not eagerly build the URLconf — this avoids circular imports
with DRF's lazy settings resolution and drf-spectacular.
"""
