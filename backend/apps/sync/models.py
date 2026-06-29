from django.db import models
from django.conf import settings
from django.utils import timezone

class DeletedRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='deleted_records'
    )
    model_name = models.CharField(max_length=64) # e.g. 'Task', 'Habit', 'Goal'
    object_id = models.CharField(max_length=64) # Client UUID or Integer ID
    deleted_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email} - Deleted {self.model_name}: {self.object_id}"


class SyncLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sync_logs'
    )
    device_id = models.CharField(max_length=128)
    last_synced_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'device_id')

    def __str__(self):
        return f"{self.user.email} on {self.device_id} last synced at {self.last_synced_at}"
