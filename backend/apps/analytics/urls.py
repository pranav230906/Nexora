from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalyticsDashboardView,
    ProductivityReportViewSet,
    TriggerReportGenerationView
)

router = DefaultRouter()
router.register('reports', ProductivityReportViewSet, basename='reports')

app_name = 'analytics'

urlpatterns = [
    path('dashboard/', AnalyticsDashboardView.as_view(), name='dashboard'),
    path('trigger/', TriggerReportGenerationView.as_view(), name='trigger-report'),
    path('', include(router.urls)),
]
