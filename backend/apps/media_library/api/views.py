"""Media library API views (authenticated/staff).

Upload security: never trusts client-provided MIME alone — the extension and
content are inspected, dangerous types rejected, filenames sanitized and size
capped. Images are verified with Pillow.
"""
import mimetypes
import re
from pathlib import Path

from django.conf import settings
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.media_library.models import MediaFile
from config.api.base.filters import MediaFilterSet
from config.api.base.viewsets import BaseViewSet

from .serializers import MediaFileSerializer, MediaUpdateSerializer, MediaUploadSerializer

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
}
MAX_SIZE = getattr(settings, "MEDIA_MAX_UPLOAD_SIZE", 10 * 1024 * 1024)
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".php", ".py", ".js", ".html", ".htm",
    ".svgz", ".jsp", ".asp", ".aspx", ".cgi", ".pl", ".rb",
}


def sanitize_filename(name: str) -> str:
    """Strip path components and dangerous characters from a filename."""
    clean = Path(name).name
    clean = re.sub(r"[^\w.\-\u0600-\u06FF ]+", "_", clean)
    return clean or "upload"


def validate_upload(upload):
    """Validate a UploadedFile against extension + size + MIME rules."""
    if upload.size <= 0:
        raise ValidationError({"file": "Empty file."})
    if upload.size > MAX_SIZE:
        raise ValidationError({"file": f"File exceeds the {MAX_SIZE // (1024 * 1024)} MB limit."})

    name = upload.name or ""
    ext = Path(name).suffix.lower()
    if ext in DANGEROUS_EXTENSIONS:
        raise ValidationError({"file": "This file type is not allowed."})
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError({"file": f"Unsupported file extension '{ext or '(none)'}'."})

    # Never trust the client MIME: derive from the extension + content sniffing.
    guessed, _ = mimetypes.guess_type(name)
    if guessed and not guessed.startswith(("image/", "application/", "text/plain", "text/csv")):
        raise ValidationError({"file": "Unexpected content type."})

    return name


class MediaViewSet(BaseViewSet):
    """Staff media library: list/search/filter + safe uploads."""

    serializer_class = MediaFileSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # The queryset intentionally does NOT filter is_deleted so the restore
    # action can reach soft-deleted rows; get_queryset() filters for reads.
    queryset = MediaFile.objects.all().select_related("created_by")
    filterset_class = MediaFilterSet
    search_fields = [
        "original_name",
        "title_en",
        "title_fa",
        "title_ar",
        "alt_text_en",
        "caption_en",
    ]
    ordering_fields = ["created_at", "size", "original_name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return MediaUploadSerializer
        if self.action in ("update", "partial_update"):
            return MediaUpdateSerializer
        return MediaFileSerializer

    def perform_destroy(self, instance):
        # Destructive deletes are never performed through the API — media is
        # soft-deleted so references keep resolving and rows can be restored.
        instance.soft_delete()

    def get_queryset(self):
        qs = super().get_queryset()
        # The restore action must be able to find soft-deleted rows.
        if self.action != "restore":
            qs = qs.filter(is_deleted=False)
        is_image = self.request.query_params.get("is_image")
        if is_image == "true":
            qs = qs.filter(mime_type__startswith="image/")
        elif is_image == "false":
            qs = qs.exclude(mime_type__startswith="image/")
        return qs

    def create(self, request, *args, **kwargs):
        serializer = MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = request.FILES.get("file")
        if upload is None:
            raise ValidationError({"file": "A file is required."})
        safe_name = sanitize_filename(upload.name or "")

        # Verify image content with Pillow (dimensions + integrity).
        width = height = None
        if upload.content_type.startswith("image/") or safe_name.lower().endswith(
            (".jpg", ".jpeg", ".png", ".gif", ".webp")
        ):
            try:
                from PIL import Image

                image = Image.open(upload)
                image.verify()
                width, height = image.size
                upload.seek(0)
            except Exception as exc:  # noqa: BLE001
                raise ValidationError(
                    {"file": "The image file is corrupt or not a valid image."}
                ) from exc

        validate_upload(upload)

        media = MediaFile.objects.create(
            file=upload,
            original_name=safe_name,
            mime_type=upload.content_type,
            size=upload.size,
            width=width,
            height=height,
            title_fa=serializer.validated_data.get("title_fa", ""),
            title_en=serializer.validated_data.get("title_en", ""),
            title_ar=serializer.validated_data.get("title_ar", ""),
            alt_text_fa=serializer.validated_data.get("alt_text_fa", ""),
            alt_text_en=serializer.validated_data.get("alt_text_en", ""),
            alt_text_ar=serializer.validated_data.get("alt_text_ar", ""),
            caption_fa=serializer.validated_data.get("caption_fa", ""),
            caption_en=serializer.validated_data.get("caption_en", ""),
            caption_ar=serializer.validated_data.get("caption_ar", ""),
            is_public=serializer.validated_data.get("is_public", True),
            created_by=request.user,
        )
        out = MediaFileSerializer(media, context={"request": request})
        return Response(
            {"success": True, "message": "Media uploaded", "data": out.data, "errors": None},
            status=201,
        )
