from rest_framework import serializers
from .models import NotificationPreference, NotificationLog, DeviceToken

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ('email_enabled', 'push_enabled', 'in_app_enabled', 'deadline_alerts_enabled', 'habits_reminder_enabled')


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ('id', 'title', 'message', 'channel', 'status', 'read', 'created_at')
        read_only_fields = ('id', 'title', 'message', 'channel', 'status', 'created_at')


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ('token',)
