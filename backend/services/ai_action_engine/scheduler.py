"""
Scheduling helper. Integrates with the existing google_calendar services
to inspect availability, verify conflicts, and schedule tasks without duplication.
"""
import logging
from django.utils import timezone
from apps.tasks.models import Task
from services.google_calendar import (
    create_calendar_event,
    detect_conflicts,
    read_calendar_events
)

logger = logging.getLogger(__name__)


def schedule_task_on_calendar(user, task: Task) -> bool:
    """
    Checks for conflicts and creates a Google Calendar event for the task.
    Returns True if scheduled successfully.
    """
    if not task.due_date:
        logger.warning(f"Task {task.id} has no due date; skipping calendar scheduling.")
        return False

    try:
        # Check conflicts
        start_time_iso = task.due_date.isoformat()
        duration = task.estimated_time or 30
        end_time = task.due_date + timezone.timedelta(minutes=duration)
        end_time_iso = end_time.isoformat()

        # Check if Google credentials exist
        from apps.google_calendar.models import GoogleCalendarCredential
        has_credentials = GoogleCalendarCredential.objects.filter(user=user).exists()
        
        if not has_credentials:
            logger.info("User has not connected Google Calendar. Skipping calendar insert.")
            return False

        # Query Google Calendar freebusy status
        conflict = detect_conflicts(user, start_time_iso, end_time_iso)
        
        if conflict:
            logger.info(f"Scheduling conflict detected for user {user.email} at {start_time_iso}. Trying to reschedule.")
            # Resolve conflict: find next available 1-hour slot after the original due date
            available_slot = _find_free_slot(user, task.due_date, duration)
            if available_slot:
                task.due_date = available_slot
                task.save()
                logger.info(f"Task {task.id} rescheduled to conflict-free slot: {available_slot}")

        # Insert event using existing service
        event = create_calendar_event(user, task)
        return event is not None

    except Exception as e:
        logger.error(f"Failed to schedule task {task.id} on Google Calendar: {e}")
        return False


def _find_free_slot(user, original_start, duration_mins: int):
    """
    Search incrementally for an open slot in the user's schedule.
    """
    try:
        # Fetch upcoming events starting from original_start
        events = read_calendar_events(user, time_min=original_start.isoformat(), max_results=20)
        
        # Simple incremental slot finder: check hourly slots
        candidate = original_start
        for _ in range(8):  # Check next 8 hours
            candidate = candidate + timezone.timedelta(hours=1)
            candidate_end = candidate + timezone.timedelta(minutes=duration_mins)
            
            # Check overlap against fetched events
            overlap = False
            for event in events:
                start = event.get('start', {})
                end = event.get('end', {})
                
                ev_start_str = start.get('dateTime') or start.get('date', '')
                ev_end_str = end.get('dateTime') or end.get('date', '')
                
                if not ev_start_str or not ev_end_str:
                    continue
                    
                import dateutil.parser
                ev_start = dateutil.parser.isoparse(ev_start_str)
                ev_end = dateutil.parser.isoparse(ev_end_str)
                
                # Check overlap: (StartA < EndB) and (EndA > StartB)
                if (candidate < ev_end) and (candidate_end > ev_start):
                    overlap = True
                    break
            
            if not overlap:
                return candidate
                
        return None
    except Exception as e:
        logger.error(f"Error resolving free slot: {e}")
        return None
