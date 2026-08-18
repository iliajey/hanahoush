"""ERP integration API URL routes.

- ``/api/v1/integration/erp/health/`` — staff-only health/status.
"""
from django.urls import path

from .views import ErpHealthView

urlpatterns = [
    path("erp/health/", ErpHealthView.as_view(), name="erp-health"),
]
