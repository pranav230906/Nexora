"""
Action generator. Translates extracted email entities into active Task instances,
schedules them on Google Calendar, and logs in-app notifications.
"""
import logging
from django.utils import timezone
from apps.tasks.models import Task, Tag
from apps.google_calendar.models import GoogleCalendarEventMapping
from services.google_calendar import create_calendar_event
from apps.notifications.tasks import send_in_app_notification_task

logger = logging.getLogger(__name__)


def generate_productivity_actions(user, entities: dict, message_id: str) -> tuple:
    """
    Creates Task, schedules Google Calendar event, and sends alerts.
    Returns (Task, event_id).
    """
    try:
        title = entities.get('title', '').strip()
        if not title:
            return None, None

        # 1. Create Task in database using existing Task structure
        tag_name = "Email Intelligence"
        tag, _ = Tag.objects.get_or_create(user=user, name=tag_name)

        due_date_val = None
        if entities.get('due_date'):
            try:
                import dateutil.parser
                due_date_val = dateutil.parser.isoparse(entities.get('due_date'))
            except Exception:
                due_date_val = timezone.now() + timezone.timedelta(days=1)

        task = Task.objects.create(
            user=user,
            title=title,
            description=entities.get('description', ''),
            status=Task.Status.TODO,
            priority=entities.get('priority', 'MEDIUM').upper(),
            due_date=due_date_val,
            estimated_time=entities.get('duration_minutes', 30),
        )
        task.tags.add(tag)
        task.save()

        # 2. Optionally schedule Calendar Event
        event_id = None
        if entities.get('schedule_calendar') is True and due_date_val:
            try:
                # Reuse existing calendar insertion helper
                event = create_calendar_event(user, task)
                if event:
                    event_id = event.get('id')
            except Exception as e:
                logger.error(f"Failed to auto-create calendar event: {e}")

        # 3. Dispatch in-app notification alert
        alert_title = f"AI Action: {task.title}"
        alert_msg = f"Extracted task from email. Scheduled for {due_date_val.strftime('%Y-%m-%d %H:%M') if due_date_val else 'tomorrow'}."
        send_in_app_notification_task.delay(user.id, alert_title, alert_msg)

        logger.info(f"AI Email Engine created task {task.id} for user {user.email}")
        return task, event_id

    except Exception as e:
        logger.error(f"Failed to generate actions for user {user.email}: {e}")
        return None, None
