"""
Celery tasks for the AI Action Engine.
Schedules background routines for morning planning, afternoon updates,
evening summaries, and deadline warning checks.
"""
from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.tasks.models import Task
from apps.notifications.tasks import (
    send_in_app_notification_task,
    send_email_notification_task
)
from services.ai_action_engine import accountability_service, reminder_strategy

User = get_user_model()


@shared_task
def morning_planning_task():
    """
    Morning routine: trigger planning messages for all active users.
    """
    users = User.objects.filter(is_active=True)
    count = 0
    for user in users:
        # Check if they have active tasks today
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        has_tasks = Task.active_objects.filter(user=user, due_date__gte=today_start).exists()
        
        if has_tasks:
            result = accountability_service.generate_accountability_message(user, "MORNING_PLANNING")
            send_in_app_notification_task.delay(
                user.id,
                "[L1] Morning Coach Session",
                result["message"]
            )
            count += 1
    return f"Triggered morning planning for {count} users."


@shared_task
def afternoon_accountability_task():
    """
    Afternoon routine: check in on user progress and nudge if stagnant.
    """
    users = User.objects.filter(is_active=True)
    count = 0
    for user in users:
        result = accountability_service.generate_accountability_message(user, "MIDDAY_CHECKIN")
        send_in_app_notification_task.delay(
            user.id,
            "[L2] Midday Coach Check-in",
            result["message"]
        )
        count += 1
    return f"Triggered midday nudge for {count} users."


@shared_task
def evening_summary_task():
    """
    Evening routine: provide productivity summary.
    """
    users = User.objects.filter(is_active=True)
    count = 0
    for user in users:
        result = accountability_service.generate_accountability_message(user, "EVENING_SUMMARY")
        send_in_app_notification_task.delay(
            user.id,
            "[L1] Evening Summary Report",
            result["message"]
        )
        count += 1
    return f"Triggered evening summaries for {count} users."


@shared_task
def deadline_monitoring_task():
    """
    Periodic task scans active tasks and sends warnings dynamically matching escalation tiers.
    """
    now = timezone.now()
    # Check tasks due in the next 12 hours that are incomplete
    tasks = Task.active_objects.filter(
        due_date__gt=now,
        due_date__lte=now + timezone.timedelta(hours=12),
        status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
    )

    warnings_sent = 0
    for task in tasks:
        time_rem = (task.due_date - now).total_seconds() / 3600.0
        level = reminder_strategy.get_escalation_level(task, time_rem)

        # Skip level 1 warning if they are already notified, send level 3+
        if level >= 3:
            alert = reminder_strategy.generate_escalation_message(task, level)
            send_in_app_notification_task.delay(
                task.user.id,
                alert["title"],
                alert["message"]
            )
            warnings_sent += 1
            
    return f"Scanned active tasks. Dispatched {warnings_sent} escalations."
