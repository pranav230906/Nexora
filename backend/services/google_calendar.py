import os
import requests
from django.conf import settings
from django.utils import timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from apps.google_calendar.models import GoogleCalendarCredential, GoogleCalendarEventMapping

def get_google_oauth_credentials(user):
    """
    Retrieves and automatically refreshes Google OAuth tokens if expired.
    Returns a google.oauth2.credentials.Credentials client object.
    """
    try:
        cred_record = GoogleCalendarCredential.objects.get(user=user)
    except GoogleCalendarCredential.DoesNotExist:
        return None

    creds = Credentials(
        token=cred_record.access_token,
        refresh_token=cred_record.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET")
    )

    # Check and refresh token if expired
    if cred_record.token_expiry <= timezone.now() or not creds.valid:
        try:
            creds.refresh(Request())
            # Save updated credentials back to the database
            cred_record.access_token = creds.token
            if creds.refresh_token:
                cred_record.refresh_token = creds.refresh_token
            # Set new expiry: 1 hour from now
            cred_record.token_expiry = timezone.now() + timezone.timedelta(seconds=3600)
            cred_record.save()
        except Exception as e:
            print(f"Failed to refresh Google token for {user.email}: {e}")
            return None

    return creds

def get_calendar_service(user):
    creds = get_google_oauth_credentials(user)
    if not creds:
        return None
    return build('calendar', 'v3', credentials=creds)

def read_calendar_events(user, time_min=None, max_results=10):
    service = get_calendar_service(user)
    if not service:
        return []

    if not time_min:
        time_min = timezone.now().isoformat()

    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        maxResults=max_results,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    return events_result.get('items', [])

def create_calendar_event(user, task):
    service = get_calendar_service(user)
    if not service:
        return None

    # Skip if task has no due date
    if not task.due_date:
        return None

    # Calculate end time (due_date + 30 mins or estimated_time)
    start_time = task.due_date
    duration = task.estimated_time or 30
    end_time = start_time + timezone.timedelta(minutes=duration)

    event_body = {
        'summary': task.title,
        'description': task.description or '',
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': user.timezone,
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': user.timezone,
        },
    }

    try:
        # Create event in Google Calendar
        event = service.events().insert(calendarId='primary', body=event_body).execute()
        # Save mapping link record
        GoogleCalendarEventMapping.objects.update_or_create(
            task=task,
            defaults={'event_id': event['id']}
        )
        return event
    except Exception as e:
        print(f"Failed to create Google event for task {task.id}: {e}")
        return None

def update_calendar_event(user, task):
    service = get_calendar_service(user)
    if not service:
        return None

    try:
        mapping = GoogleCalendarEventMapping.objects.get(task=task)
    except GoogleCalendarEventMapping.DoesNotExist:
        # If mapping doesn't exist, create it now
        return create_calendar_event(user, task)

    if not task.due_date:
        # If task due_date was removed, delete event
        return delete_calendar_event(user, task)

    start_time = task.due_date
    duration = task.estimated_time or 30
    end_time = start_time + timezone.timedelta(minutes=duration)

    event_body = {
        'summary': task.title,
        'description': task.description or '',
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': user.timezone,
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': user.timezone,
        },
    }

    try:
        event = service.events().update(
            calendarId='primary',
            eventId=mapping.event_id,
            body=event_body
        ).execute()
        return event
    except Exception as e:
        print(f"Failed to update Google event {mapping.event_id} for task {task.id}: {e}")
        return None

def delete_calendar_event(user, task):
    service = get_calendar_service(user)
    if not service:
        return False

    try:
        mapping = GoogleCalendarEventMapping.objects.get(task=task)
        service.events().delete(calendarId='primary', eventId=mapping.event_id).execute()
        mapping.delete()
        return True
    except GoogleCalendarEventMapping.DoesNotExist:
        return False
    except Exception as e:
        print(f"Failed to delete Google event mapping for task {task.id}: {e}")
        return False

def detect_conflicts(user, start_time_iso, end_time_iso):
    """
    Queries Google Calendar's freebusy API to find conflicts during a given time window.
    """
    service = get_calendar_service(user)
    if not service:
        return None

    body = {
        "timeMin": start_time_iso,
        "timeMax": end_time_iso,
        "items": [{"id": "primary"}]
    }

    try:
        result = service.freebusy().query(body=body).execute()
        busy_slots = result.get('calendars', {}).get('primary', {}).get('busy', [])
        return len(busy_slots) > 0 # Returns True if busy (conflict detected)
    except Exception as e:
        print(f"Failed to check freebusy availability: {e}")
        return None
