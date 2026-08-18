"""Base pagination classes for the Hanahoush API.

Provides consistent pagination across all list endpoints with
configurable page size and cursor-based options.
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from django.conf import settings


class DefaultPagination(PageNumberPagination):
    """Standard page-number pagination with configurable size."""

    page_size = getattr(settings, "ADMIN_LIST_PER_PAGE", 20)
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "success": True,
                "message": "",
                "data": data,
                "pagination": {
                    "count": self.page.paginator.count,
                    "num_pages": self.page.paginator.num_pages,
                    "current_page": self.page.number,
                    "page_size": self.get_page_size(self.request),
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
                "errors": None,
            }
        )


class CursorPagination(PageNumberPagination):
    """Cursor-based pagination for large datasets.

    More efficient for deep pagination on ordered datasets.
    """

    page_size = 50
    ordering = "-created_at"
    cursor_query_param = "cursor"

    def get_paginated_response(self, data):
        return Response(
            {
                "success": True,
                "message": "",
                "data": data,
                "pagination": {
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
                "errors": None,
            }
        )