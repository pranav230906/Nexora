from django.urls import path
from .views import (
    GoogleCalendarStatusView,
    GoogleCalendarOAuthView,
    GoogleCalendarSyncView,
    GoogleCalendarMeetingsView,
    GoogleCalendarAvailabilityView
)

app_name = 'google_calendar'

urlpatterns = [
    path('status/', GoogleCalendarStatusView.as_view(), name='status'),
    path('oauth/', GoogleCalendarOAuthView.as_view(), name='oauth'),
    path('sync/', GoogleCalendarSyncView.as_view(), name='sync'),
    path('meetings/', GoogleCalendarMeetingsView.as_view(), name='meetings'),
    path('availability/', GoogleCalendarAvailabilityView.as_view(), name='availability'),
]
