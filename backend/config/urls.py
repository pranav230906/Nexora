from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),

    # API Documentation via drf-spectacular
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Versioning endpoints
    path('api/v1/auth/', include('apps.authentication.urls', namespace='auth')),
    path('api/v1/', include('apps.tasks.urls', namespace='tasks')),
    path('api/v1/', include('apps.goals_habits.urls', namespace='goals_habits')),
    path('api/v1/calendar/', include('apps.google_calendar.urls', namespace='google_calendar')),
    path('api/v1/ai/', include('apps.ai_assistant.urls', namespace='ai_assistant')),
    path('api/v1/chatbot/', include('apps.ai_chatbot.urls', namespace='ai_chatbot')),
    path('api/v1/notifications/', include('apps.notifications.urls', namespace='notifications')),
    path('api/v1/gamification/', include('apps.gamification.urls', namespace='gamification')),
    path('api/v1/analytics/', include('apps.analytics.urls', namespace='analytics')),
    path('api/v1/sync/', include('apps.sync.urls', namespace='sync')),
    path('api/v1/action-engine/', include('apps.ai_action_engine.urls', namespace='ai_action_engine')),
]
