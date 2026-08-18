"""API version 1.

Mounts the presentation layer of every feature app under the
``/api/v1/`` prefix. Apps contribute their own router ``urlpatterns``
(prefixed by the router) and are included here:

    urlpatterns = [
        path("auth/", include(("apps.accounts.api.urls", "auth"))),
        path("", include(("apps.articles.api.urls", "articles"))),
        path("", include(("apps.projects.api.urls", "projects"))),
        ...
    ]
"""
from django.urls import include, path

app_name = "v1"

urlpatterns = [
    path("auth/", include(("apps.accounts.api.urls", "auth"))),
    path("", include(("apps.core.api.urls", "core"))),
    path("", include(("apps.articles.api.urls", "articles"))),
    path("", include(("apps.projects.api.urls", "projects"))),
    path("", include(("apps.services.api.urls", "services"))),
    path("", include(("apps.company.api.urls", "company"))),
    path("", include(("apps.page_builder.api.urls", "page_builder"))),
    path("editorial/", include(("apps.editorial.api.urls", "editorial"))),
    path("", include(("apps.analytics.api.urls", "analytics"))),
    path("", include(("apps.media_library.api.urls", "media"))),
    path("", include(("apps.search.api.urls", "search"))),
    path("integration/", include(("apps.integration.presentation.api.urls", "integration"))),
]
