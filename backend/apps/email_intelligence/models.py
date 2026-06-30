from django.db import models
from django.conf import settings
from apps.tasks.models import Task


class GmailCredential(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gmail_credential')
    gmail_address = models.EmailField()
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True, null=True)
    token_expiry = models.DateTimeField()
    is_sync_paused = models.BooleanField(default=False)
    monitored_categories = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - Connected to {self.gmail_address}"


class SyncedEmail(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='synced_emails')
    message_id = models.CharField(max_length=255)
    thread_id = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, blank=True)
    from_address = models.CharField(max_length=255, blank=True)
    received_at = models.DateTimeField()
    is_processed = models.BooleanField(default=False)
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='synced_email_records')
    event_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'message_id')

    def __str__(self):
        return f"{self.user.email} - Message {self.message_id} ({self.subject[:30]})"
