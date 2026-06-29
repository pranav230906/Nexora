import os
import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import NotificationLog, NotificationPreference, DeviceToken
from apps.tasks.models import Task

User = get_user_model()
logger = logging.getLogger(__name__)

# Initialize Firebase SDK dynamically if settings configured
firebase_app = None
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_JSON_PATH', None) or os.environ.get('FIREBASE_CREDENTIALS_JSON_PATH')
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_app = firebase_admin.initialize_app(cred)
except Exception as e:
    logger.warning(f"Firebase Admin SDK initialization skipped: {e}")


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_notification_task(self, user_id, title, message):
    """
    Asynchronously sends an email notification with backoff retry logic.
    """
    try:
        user = User.objects.get(id=user_id)
        # Check preferences
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        if not pref.email_enabled:
            return "Email notification skipped (disabled by user)."

        # Log pending entry
        log = NotificationLog.objects.create(
            user=user,
            title=title,
            message=message,
            channel=NotificationLog.Channel.EMAIL,
            status=NotificationLog.Status.PENDING
        )

        # Dispatch email
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False
        )

        log.status = NotificationLog.Status.SENT
        log.save()
        return f"Email sent to {user.email}"

    except Exception as exc:
        logger.error(f"Failed to send email notification: {exc}")
        # Log failure
        try:
            log.status = NotificationLog.Status.FAILED
            log.error_message = str(exc)
            log.save()
        except Exception:
            pass
        # Retry with exponential backoff
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_push_notification_task(self, user_id, title, message):
    """
    Asynchronously sends an FCM Push notification.
    """
    try:
        user = User.objects.get(id=user_id)
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        if not pref.push_enabled:
            return "Push notification skipped (disabled by user)."

        # Fetch device tokens
        tokens = list(DeviceToken.objects.filter(user=user).values_list('token', flat=True))
        if not tokens:
            return "Push notification skipped (no device tokens registered)."

        log = NotificationLog.objects.create(
            user=user,
            title=title,
            message=message,
            channel=NotificationLog.Channel.PUSH,
            status=NotificationLog.Status.PENDING
        )

        if not firebase_app:
            raise Exception("Firebase Admin SDK is not initialized.")

        # Send push notification payload to all device tokens
        for token in tokens:
            fcm_msg = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=message,
                ),
                token=token,
            )
            messaging.send(fcm_msg)

        log.status = NotificationLog.Status.SENT
        log.save()
        return f"Push notification sent to {len(tokens)} devices."

    except Exception as exc:
        logger.error(f"Failed to send push notification: {exc}")
        try:
            log.status = NotificationLog.Status.FAILED
            log.error_message = str(exc)
            log.save()
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task
def send_in_app_notification_task(user_id, title, message):
    """
    Asynchronously logs an In-App notification and broadcasts it 
    real-time via Django Channels WebSockets.
    """
    try:
        user = User.objects.get(id=user_id)
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        if not pref.in_app_enabled:
            return "In-App notification skipped (disabled by user)."

        # Save to database log
        log = NotificationLog.objects.create(
            user=user,
            title=title,
            message=message,
            channel=NotificationLog.Channel.IN_APP,
            status=NotificationLog.Status.SENT
        )

        # Broadcast via Django Channels layer
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"notifications_{user_id}",
                {
                    "type": "notification_message",
                    "notification": {
                        "id": log.id,
                        "title": log.title,
                        "message": log.message,
                        "created_at": log.created_at.isoformat()
                    }
                }
            )

        return f"In-App notification logged and broadcasted for {user.email}"

    except Exception as e:
        logger.error(f"Failed to send In-App notification: {e}")
        return f"Error: {str(e)}"


@shared_task
def deadline_alert_checker_task():
    """
    Periodic task running via Celery Beat.
    Scans for active tasks due in the next 24 hours and issues alerts.
    """
    now = timezone.now()
    threshold = now + timezone.timedelta(hours=24)

    # Find tasks due within 24 hours that are not completed
    tasks = Task.active_objects.filter(
        due_date__gt=now,
        due_date__lte=threshold,
        status__in=['TODO', 'IN_PROGRESS']
    )

    sent_alerts = 0
    for task in tasks:
        # Check if we already logged a deadline warning notification for this task
        warning_subject = f"Deadline Alert: {task.title}"
        already_alerted = NotificationLog.objects.filter(
            user=task.user,
            title=warning_subject,
            created_at__gt=now - timezone.timedelta(hours=24)
        ).exists()

        if not already_alerted:
            message = f"Your task '{task.title}' is due on {task.due_date.strftime('%Y-%m-%d %H:%M')}. Don't miss it!"
            
            # Send through all three channels asynchronously
            send_email_notification_task.delay(task.user.id, warning_subject, message)
            send_push_notification_task.delay(task.user.id, warning_subject, message)
            send_in_app_notification_task.delay(task.user.id, warning_subject, message)
            sent_alerts += 1

    return f"Deadline checker complete. Sent {sent_alerts} alerts."
