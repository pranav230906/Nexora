from django.urls import path
from . import views

app_name = 'email_intelligence'

urlpatterns = [
    path('connect/', views.GmailConnectView.as_view(), name='connect'),
    path('oauth/callback/', views.GmailCallbackView.as_view(), name='oauth-callback'),
    path('disconnect/', views.GmailDisconnectView.as_view(), name='disconnect'),
    path('status/', views.GmailStatusView.as_view(), name='status'),
    path('sync/', views.GmailSyncView.as_view(), name='sync'),
    path('emails/', views.SyncedEmailsListView.as_view(), name='emails-list'),
    path('process-email/', views.ProcessEmailView.as_view(), name='process-email'),
    path('reprocess/<int:pk>/', views.ReprocessEmailView.as_view(), name='reprocess-email'),
    path('history/', views.SyncHistoryView.as_view(), name='sync-history'),
]
