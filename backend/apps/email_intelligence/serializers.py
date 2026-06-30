from rest_framework import serializers
from .models import GmailCredential, SyncedEmail


class GmailOAuthConnectSerializer(serializers.Serializer):
    redirect_uri = serializers.URLField(required=True, help_text="The URL Google should redirect back to after consent.")


class GmailOAuthCallbackSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, help_text="OAuth authorization code returned by Google.")
    redirect_uri = serializers.URLField(required=True, help_text="Original redirect URI used during flow.")


class GmailCredentialStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = GmailCredential
        fields = ('gmail_address', 'is_sync_paused', 'monitored_categories', 'created_at', 'updated_at')
        read_only_fields = ('gmail_address', 'created_at', 'updated_at')


class SyncedEmailSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_priority = serializers.CharField(source='task.priority', read_only=True)
    task_status = serializers.CharField(source='task.status', read_only=True)

    class Meta:
        model = SyncedEmail
        fields = ('id', 'message_id', 'thread_id', 'subject', 'from_address', 'received_at', 'is_processed', 'task_id', 'task_title', 'task_priority', 'task_status', 'event_id')


class ProcessEmailInputSerializer(serializers.Serializer):
    message_payload = serializers.JSONField(required=True, help_text="Raw JSON message resource from Google API.")
