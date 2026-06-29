from celery import shared_task
from django.utils import timezone
from .models import GoogleCalendarCredential
from apps.tasks.models import Task
from services.google_calendar import create_calendar_event

@shared_task(name="google_calendar.sync_all_users_calendars")
def sync_all_users_calendars():
    """
    Periodic Celery background task synchronizing active tasks
    for all linked Google Calendar users.
    """
    credentials = GoogleCalendarCredential.objects.all()
    synced_users_count = 0
    synced_events_count = 0

    for cred in credentials:
        user = cred.user
        # Retrieve active tasks that have due dates
        tasks = Task.active_objects.filter(user=user, due_date__isnull=False)
        user_synced_count = 0
        
        for task in tasks:
            event = create_calendar_event(user, task)
            if event:
                user_synced_count += 1
                
        if user_synced_count > 0:
            synced_users_count += 1
            synced_events_count += user_synced_count

    return f"Completed background sync. Synced {synced_events_count} events for {synced_users_count} users."
