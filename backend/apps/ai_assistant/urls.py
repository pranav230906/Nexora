from django.urls import path
from .views import (
    AIPlannerView,
    AIPriorityView,
    AICoachView,
    AIScheduleOptimizerView,
    AIDeadlinePredictorView,
    AITaskBreakdownView,
    AIMotivationView,
    AIDailySummaryView,
    AIWeeklySummaryView,
    AICostAnalyticsView
)

app_name = 'ai_assistant'

urlpatterns = [
    path('planner/', AIPlannerView.as_view(), name='planner'),
    path('priority/', AIPriorityView.as_view(), name='priority'),
    path('coach/', AICoachView.as_view(), name='coach'),
    path('optimize/', AIScheduleOptimizerView.as_view(), name='optimize'),
    path('deadline/', AIDeadlinePredictorView.as_view(), name='deadline'),
    path('breakdown/', AITaskBreakdownView.as_view(), name='breakdown'),
    path('motivation/', AIMotivationView.as_view(), name='motivation'),
    path('summary/daily/', AIDailySummaryView.as_view(), name='daily-summary'),
    path('summary/weekly/', AIWeeklySummaryView.as_view(), name='weekly-summary'),
    path('analytics/cost/', AICostAnalyticsView.as_view(), name='cost-analytics'),
]
