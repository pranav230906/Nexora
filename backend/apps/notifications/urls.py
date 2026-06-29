from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationPreferenceView,
    NotificationLogViewSet,
    DeviceTokenCreateView
)

router = DefaultRouter()
router.register('logs', NotificationLogViewSet, basename='logs')

app_name = 'notifications'

urlpatterns = [
    path('preferences/', NotificationPreferenceView.as_view(), name='preferences'),
    path('device/', DeviceTokenCreateView.as_view(), name='device-register'),
    path('', include(router.urls)),
]
