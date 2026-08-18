"""Root URL configuration for the Hanahoush backend.

URL namespaces:
- ``api/``        versioned REST API (see config/api)
- ``__debug__``   Django Debug Toolbar (local only)
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.seo.views import robots_txt, sitemap_xml
from config.api.swagger import swagger_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    # CKEditor 5 admin endpoints (rich text editor uploads/preview).
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("api/", include("config.api.urls")),
    # SEO (Phase 8H): generated from published content.
    path("sitemap.xml", sitemap_xml, name="sitemap"),
    path("robots.txt", robots_txt, name="robots"),
] + swagger_urlpatterns

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
            *urlpatterns,
        ]
