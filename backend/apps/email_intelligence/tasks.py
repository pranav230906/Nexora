"""
Celery background tasks for Gmail synchronization and Token refreshes.
"""
from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.email_intelligence.models import GmailCredential
from services.email_intelligence.oauth_service import refresh_user_gmail_tokens
from services.email_intelligence.email_sync import synchronize_user_gmail

User = get_user_model()


@shared_task
def refresh_gmail_tokens_task():
    """
    Background job: runs periodically to refresh expiring Google OAuth tokens.
    """
    credentials = GmailCredential.objects.all()
    refreshed_count = 0
    for cred in credentials:
        # If token expires in less than 15 minutes, refresh
        if cred.token_expiry <= timezone.now() + timezone.timedelta(minutes=15):
            res = refresh_user_gmail_tokens(cred.user)
            if res:
                refreshed_count += 1
    return f"Refreshed Gmail tokens for {refreshed_count} users."


@shared_task
def scheduled_gmail_sync_task():
    """
    Background job: scheduled cron to pull unread emails and generate tasks.
    """
    credentials = GmailCredential.objects.filter(is_sync_paused=False)
    processed_count = 0
    total_actions_created = 0

    for cred in credentials:
        try:
            actions_count = synchronize_user_gmail(cred.user)
            total_actions_created += actions_count
            processed_count += 1
        except Exception:
            pass # Keep looping through other users if one fails

    return f"Synced Gmail inbox for {processed_count} users. Created {total_actions_created} new tasks."
