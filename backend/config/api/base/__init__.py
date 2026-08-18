"""Base API package for Hanahoush.

This package deliberately keeps an empty ``__init__``: components import
directly from their submodules to avoid circular imports with DRF's lazy
settings resolution.

Reusable components:
- ``pagination``    → DefaultPagination, CursorPagination
- ``serializers``   → base serializer classes
- ``filters``       → reusable FilterSets
- ``ordering``      → ordering/search filters
- ``viewsets``      → BaseViewSet, PublishableViewSet
- ``responses``     → standard response builder + error handler
"""
