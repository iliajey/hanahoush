"""User domain feature app (reference Clean Architecture layout).

Layers:
- domain/        pure business rules, entities, ports (no Django)
- application/   use cases + DTOs, orchestrates the domain
- infrastructure/Django models, repositories, external services
- presentation/  serializers, views, urls, admin

This app is intentionally EMPTY. Authentication/User management is a
later-phase concern; the structure demonstrates where each artifact
belongs. Copy this layout for every new feature app.
"""
