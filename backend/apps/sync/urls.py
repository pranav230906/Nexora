from django.urls import path
from .views import SynchronizationAPIView

app_name = 'sync'

urlpatterns = [
    path('', SynchronizationAPIView.as_view(), name='sync-endpoint'),
]
