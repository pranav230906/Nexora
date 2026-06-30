from django.urls import path
from . import views

app_name = 'ai_action_engine'

urlpatterns = [
    path('process-input/', views.ProcessInputView.as_view(), name='process-input'),
    path('voice/', views.VoiceUploadView.as_view(), name='voice-upload'),
    path('verify-task/', views.VerifyTaskView.as_view(), name='verify-task'),
    path('accountability/', views.AccountabilityView.as_view(), name='accountability'),
    path('reminders/', views.RemindersListView.as_view(), name='reminders-list'),
    path('progress/', views.ProgressAnalyticsView.as_view(), name='progress-analytics'),
    path('replan/', views.ReplanDayView.as_view(), name='replan-day'),
]
