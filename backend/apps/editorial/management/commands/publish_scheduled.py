"""Publish editorial content whose schedule is due."""
from django.core.management.base import BaseCommand

from apps.editorial.services import ScheduleService


class Command(BaseCommand):
    help = "Publish content whose PublicationSchedule is due (idempotent)."

    def handle(self, *args, **options):
        published = ScheduleService.publish_due()
        self.stdout.write(self.style.SUCCESS(f"Published {len(published)} scheduled item(s)."))
