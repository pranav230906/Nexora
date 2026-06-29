from django.db import models
from django.conf import settings
from apps.tasks.models import Task

class GoogleCalendarCredential(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_calendar_credential')
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True, null=True)
    token_expiry = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Credentials for {self.user.email}"


class GoogleCalendarEventMapping(models.Model):
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='calendar_mapping')
    event_id = models.CharField(max_length=255)
    synced_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Task {self.task.id} mapped to Event {self.event_id}"
