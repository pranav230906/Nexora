from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet

router = DefaultRouter()
router.register('session', ChatSessionViewSet, basename='session')

app_name = 'ai_chatbot'

urlpatterns = [
    path('', include(router.urls)),
]
