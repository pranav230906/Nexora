from rest_framework import views, viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import NotificationPreference, NotificationLog, DeviceToken
from .serializers import (
    NotificationPreferenceSerializer,
    NotificationLogSerializer,
    DeviceTokenSerializer
)

class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        pref, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return pref


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Return in-app notifications only
        return NotificationLog.objects.filter(
            user=self.request.user,
            channel=NotificationLog.Channel.IN_APP
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        NotificationLog.objects.filter(
            user=request.user,
            channel=NotificationLog.Channel.IN_APP,
            read=False
        ).update(read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)


class DeviceTokenCreateView(generics.CreateAPIView):
    serializer_class = DeviceTokenSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        # Avoid duplicate device tokens
        token = serializer.validated_data['token']
        DeviceToken.objects.get_or_create(user=self.request.user, token=token)
