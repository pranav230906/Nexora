from rest_framework import views, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
import os

from .models import GmailCredential, SyncedEmail
from .serializers import (
    GmailOAuthConnectSerializer,
    GmailOAuthCallbackSerializer,
    GmailCredentialStatusSerializer,
    SyncedEmailSerializer,
    ProcessEmailInputSerializer
)
from services.email_intelligence.oauth_service import get_oauth_flow
from services.email_intelligence.email_sync import synchronize_user_gmail, process_single_email_payload


class EmailIntelligenceThrottle(UserRateThrottle):
    rate = '15/minute'


class GmailConnectView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = [EmailIntelligenceThrottle]

    @extend_schema(
        request=GmailOAuthConnectSerializer,
        description="Generates the Google OAuth 2.0 authorization URL to connect a Gmail account."
    )
    def post(self, request):
        serializer = GmailOAuthConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        redirect_uri = serializer.validated_data['redirect_uri']

        try:
            import urllib.parse
            from services.email_intelligence.oauth_service import GMAIL_SCOPES
            
            client_id = os.environ.get("GOOGLE_CLIENT_ID") or "mock_client_id"
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(GMAIL_SCOPES),
                "access_type": "offline",
                "prompt": "consent"
            }
            authorization_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
            return Response({"authorization_url": authorization_url}, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Failed to generate OAuth URL: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GmailCallbackView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        request=GmailOAuthCallbackSerializer,
        description="Handles the redirect callback from Google OAuth, exchanges the code for tokens, and links the account."
    )
    def post(self, request):
        serializer = GmailOAuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        redirect_uri = serializer.validated_data['redirect_uri']

        try:
            flow = get_oauth_flow(redirect_uri)
            flow.fetch_token(code=code)
            creds = flow.credentials

            # Extract user profile email address from Google API
            import requests
            profile_response = requests.get(
                "https://www.googleapis.com/oauth2/v1/userinfo",
                headers={"Authorization": f"Bearer {creds.token}"}
            )
            profile_email = profile_response.json().get('email', '')

            # Save credentials in database
            credential, created = GmailCredential.objects.update_or_create(
                user=request.user,
                defaults={
                    'gmail_address': profile_email,
                    'access_token': creds.token,
                    'refresh_token': creds.refresh_token or '',
                    'token_expiry': timezone.now() + timezone.timedelta(seconds=3600),
                    'is_sync_paused': False
                }
            )

            # Trigger background synchronization immediately
            synchronize_user_gmail(request.user)

            return Response({
                "message": "Gmail account linked successfully.",
                "gmail_address": profile_email
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Failed to authenticate callback: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GmailDisconnectView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        """
        Disconnects the user's Gmail account and purges credentials.
        """
        try:
            credential = GmailCredential.objects.get(user=request.user)
            credential.delete()
            # Also clear sync records
            SyncedEmail.objects.filter(user=request.user).delete()
            return Response({"message": "Gmail account disconnected and credentials removed."}, status=status.HTTP_200_OK)
        except GmailCredential.DoesNotExist:
            return Response({"error": "No connected Gmail account found."}, status=status.HTTP_404_NOT_FOUND)


class GmailStatusView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        responses={200: GmailCredentialStatusSerializer},
        description="Returns the connection status and parameters of the linked Gmail integration."
    )
    def get(self, request):
        try:
            credential = GmailCredential.objects.get(user=request.user)
            serializer = GmailCredentialStatusSerializer(credential)
            return Response({"connected": True, **serializer.data}, status=status.HTTP_200_OK)
        except GmailCredential.DoesNotExist:
            return Response({"connected": False, "message": "No Gmail account connected."}, status=status.HTTP_200_OK)

    @extend_schema(
        request=GmailCredentialStatusSerializer,
        responses={200: GmailCredentialStatusSerializer},
        description="Updates synchronization parameters (pauses or changes monitored categories)."
    )
    def patch(self, request):
        try:
            credential = GmailCredential.objects.get(user=request.user)
            serializer = GmailCredentialStatusSerializer(credential, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except GmailCredential.DoesNotExist:
            return Response({"error": "No connected Gmail account found."}, status=status.HTTP_404_NOT_FOUND)


class GmailSyncView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = [EmailIntelligenceThrottle]

    def post(self, request):
        """
        Triggers a manual synchronization pull of unread emails.
        """
        try:
            new_tasks = synchronize_user_gmail(request.user)
            return Response({
                "success": True,
                "message": "Manual synchronization completed.",
                "new_tasks_created": new_tasks
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Synchronization failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SyncedEmailsListView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        responses={200: SyncedEmailSerializer(many=True)},
        description="Lists all Gmail messages pulled and processed by the system."
    )
    def get(self, request):
        emails = SyncedEmail.objects.filter(user=request.user).order_by('-received_at')[:50]
        serializer = SyncedEmailSerializer(emails, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProcessEmailView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        request=ProcessEmailInputSerializer,
        description="Processes a single raw Google API message payload manually."
    )
    def post(self, request):
        serializer = ProcessEmailInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data['message_payload']

        task, event_id = process_single_email_payload(request.user, payload)
        if task:
            return Response({
                "success": True,
                "task_id": task.id,
                "task_title": task.title,
                "event_id": event_id,
                "message": f"Successfully extracted task: '{task.title}'"
            }, status=status.HTTP_200_OK)
            
        return Response({"success": False, "message": "Email contained no actionable items."}, status=status.HTTP_200_OK)


class ReprocessEmailView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk=None):
        """
        Forcibly re-processes a previously synced email.
        """
        try:
            email = SyncedEmail.objects.get(id=pk, user=request.user)
        except SyncedEmail.DoesNotExist:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        # Purge existing task mapping to prevent duplicate references
        if email.task:
            email.task.delete()
            email.task = None
            email.save()

        # Re-run sync pipeline for this message ID
        from services.email_intelligence.gmail_service import get_message_detail
        detail = get_message_detail(request.user, email.message_id)
        if not detail:
            return Response({"error": "Failed to fetch email payload details from Gmail API."}, status=status.HTTP_400_BAD_REQUEST)

        from services.email_intelligence import email_parser, entity_extractor, action_generator
        parsed = email_parser.parse_raw_message(detail)
        entities = entity_extractor.extract_action_entities(parsed['subject'], parsed['body'])
        task, event_id = action_generator.generate_productivity_actions(request.user, entities, email.message_id)
        
        if task:
            email.task = task
            email.event_id = event_id
        email.is_processed = True
        email.save()

        return Response({
            "success": True,
            "task_id": task.id if task else None,
            "event_id": event_id,
            "message": "Email re-processed successfully."
        }, status=status.HTTP_200_OK)


class SyncHistoryView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        """
        Returns audit synchronization statistics.
        """
        total = SyncedEmail.objects.filter(user=request.user).count()
        processed = SyncedEmail.objects.filter(user=request.user, is_processed=True).count()
        actions = SyncedEmail.objects.filter(user=request.user, task__isnull=False).count()
        
        return Response({
            "total_synced_emails": total,
            "processed_emails": processed,
            "productivity_tasks_created": actions
        }, status=status.HTTP_200_OK)
