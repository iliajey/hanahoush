"""Abstract base models shared by every feature app.

These are reusable Django ORM building blocks, not business models.
Feature apps inherit from them instead of re-declaring common fields.
"""
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Adds created_at / updated_at to any model."""

    created_at = models.DateTimeField(auto_now_add=True, editable=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Adds soft-delete support (deleted_at) for auditable data.

    Enables reversible deletions and "trash" flows without destructive
    SQL — useful for ERP data later.
    """

    deleted_at = models.DateTimeField(null=True, blank=True, editable=False)

    class Meta:
        abstract = True

    def soft_delete(self) -> None:
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self) -> None:
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
