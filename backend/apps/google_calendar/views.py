import os
import requests
from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from .models import GoogleCalendarCredential
from .serializers import OAuthCallbackSerializer, ConflictCheckSerializer
from services.google_calendar import (
    read_calendar_events,
    create_calendar_event,
    detect_conflicts
)
from apps.tasks.models import Task

class GoogleCalendarStatusView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        has_credentials = GoogleCalendarCredential.objects.filter(user=request.user).exists()
        return Response({
            "connected": has_credentials,
            "message": "Google Calendar linked successfully." if has_credentials else "Google Calendar is not linked."
        }, status=status.HTTP_200_OK)


class GoogleCalendarOAuthView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(request=OAuthCallbackSerializer)
    def post(self, request):
        serializer = OAuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        
        # Default redirect uri or custom
        redirect_uri = serializer.validated_data.get('redirect_uri') or os.environ.get(
            "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback"
        )

        # Exchange auth code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }

        try:
            response = requests.post(token_url, data=payload)
            token_data = response.json()

            if response.status_code != 200:
                return Response(
                    {"error": "Failed to exchange auth code.", "details": token_data},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Store credentials
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 3600)
            token_expiry = timezone.now() + timezone.timedelta(seconds=expires_in)

            # Save or Update Credential securely
            defaults = {
                'access_token': access_token,
                'token_expiry': token_expiry
            }
            if refresh_token:
                defaults['refresh_token'] = refresh_token

            cred, created = GoogleCalendarCredential.objects.update_or_create(
                user=request.user,
                defaults=defaults
            )

            return Response({
                "message": "Google credentials stored successfully.",
                "connected": True
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            # Print to Django console stdout
            traceback.print_exc()
            
            # Write to a secure file we can read to debug
            try:
                os.makedirs('secrets', exist_ok=True)
                with open('secrets/oauth_error.txt', 'w') as f:
                    f.write(f"Error: {str(e)}\n\nTraceback:\n")
                    traceback.print_exc(file=f)
            except Exception:
                pass
                
            return Response({"error": f"Internal OAuth Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleCalendarSyncView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        """
        Manually triggers a complete synchronization of user's active tasks to Google Calendar.
        """
        user = request.user
        has_credentials = GoogleCalendarCredential.objects.filter(user=user).exists()
        if not has_credentials:
            return Response({"error": "Google Calendar is not linked. Please complete OAuth flow."}, status=status.HTTP_400_BAD_REQUEST)

        # Sync all active tasks that have due dates
        tasks = Task.active_objects.filter(user=user, due_date__isnull=False)
        synced_count = 0

        for task in tasks:
            event = create_calendar_event(user, task)
            if event:
                synced_count += 1

        return Response({
            "message": "Sync completed successfully.",
            "synced_count": synced_count
        }, status=status.HTTP_200_OK)


class GoogleCalendarMeetingsView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        """
        Fetches upcoming meetings directly from the user's Google Calendar.
        """
        has_credentials = GoogleCalendarCredential.objects.filter(user=request.user).exists()
        if not has_credentials:
            return Response({
                "connected": False,
                "meetings": [],
                "message": "Google Calendar is not linked."
            }, status=status.HTTP_200_OK)

        try:
            events = read_calendar_events(request.user)
            meetings = []
            
            for event in events:
                start = event.get('start', {})
                start_time = start.get('dateTime') or start.get('date', '')
                
                meetings.append({
                    "id": event.get('id'),
                    "title": event.get('summary', 'Untitled Event'),
                    "description": event.get('description', ''),
                    "startTime": start_time,
                    "htmlLink": event.get('htmlLink', '')
                })

            return Response({
                "connected": True,
                "meetings": meetings
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Failed to fetch meetings: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleCalendarAvailabilityView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(request=ConflictCheckSerializer)
    def post(self, request):
        """
        Inspects availability to check if a conflict exists in a specific time slot.
        """
        serializer = ConflictCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        start_time = serializer.validated_data['start_time'].isoformat()
        end_time = serializer.validated_data['end_time'].isoformat()

        has_credentials = GoogleCalendarCredential.objects.filter(user=request.user).exists()
        if not has_credentials:
            return Response({"error": "Google Calendar is not linked."}, status=status.HTTP_400_BAD_REQUEST)

        has_conflict = detect_conflicts(request.user, start_time, end_time)
        
        if has_conflict is None:
            return Response({"error": "Failed to verify availability."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "has_conflict": has_conflict,
            "message": "Slot has conflict / is busy." if has_conflict else "Slot is open and available."
        }, status=status.HTTP_200_OK)
