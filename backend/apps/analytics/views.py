from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Sum, Count, Q, F
from django.utils import timezone

from .models import UserProductivityReport, DailyFocusLog
from .serializers import UserProductivityReportSerializer
from .tasks import generate_user_productivity_report
from apps.tasks.models import Task
from apps.goals_habits.models import Habit, HabitLog, Goal

class AnalyticsDashboardView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        cache_key = f"analytics_dashboard_{user.id}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 1. Task Stats
        tasks_query = Task.active_objects.filter(user=user)
        total_tasks = tasks_query.count()
        completed_tasks = tasks_query.filter(status='COMPLETED').count()
        task_completion_rate = (
            (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 100.0
        )

        # 2. Habit Stats
        total_habits = Habit.objects.filter(user=user).count()
        habit_logs_completed = HabitLog.objects.filter(
            habit__user=user,
            is_completed=True
        ).count()
        
        # Look back over last 30 days
        thirty_days_ago = timezone.now().date() - timezone.timedelta(days=30)
        expected_habit_logs = total_habits * 30
        
        habit_consistency = (
            (habit_logs_completed / expected_habit_logs * 100.0)
            if expected_habit_logs > 0 else 100.0
        )
        habit_consistency = min(100.0, max(0.0, habit_consistency))

        # 3. Goal Stats
        goals_query = Goal.objects.filter(user=user)
        total_goals = goals_query.count()
        completed_goals = goals_query.filter(is_completed=True).count()
        goal_success_rate = (
            (completed_goals / total_goals * 100.0) if total_goals > 0 else 100.0
        )

        # 4. Focus Hours Stats
        focus_minutes = DailyFocusLog.objects.filter(user=user).aggregate(total=Sum('focus_minutes'))['total'] or 0
        focus_hours = float(focus_minutes) / 60.0

        # 5. Productivity Score
        # Combination of Task Completion (40%), Habit Consistency (40%), Goal Completion (20%)
        productivity_score = int(
            (task_completion_rate * 0.4) + 
            (habit_consistency * 0.4) + 
            (goal_success_rate * 0.2)
        )
        productivity_score = min(100, max(0, productivity_score))

        # 6. Time/Task Distribution by Tag Labels
        tags_distribution = (
            Task.active_objects.filter(user=user)
            .values(tag_name=F('tags__name'))
            .annotate(count=Count('id'))
            .filter(tag_name__isnull=False)
            .order_by('-count')
        )
        time_dist = []
        for td in tags_distribution:
            time_dist.append({
                'label': td['tag_name'],
                'value': td['count']
            })

        dashboard_data = {
            'productivity_score': productivity_score,
            'task_completion_rate': round(task_completion_rate, 1),
            'habit_consistency': round(habit_consistency, 1),
            'goal_success_rate': round(goal_success_rate, 1),
            'focus_hours': round(focus_hours, 1),
            'time_distribution': time_dist
        }

        # Cache results for 15 minutes (900 seconds)
        cache.set(cache_key, dashboard_data, 900)

        return Response(dashboard_data, status=status.HTTP_200_OK)


class ProductivityReportViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserProductivityReportSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserProductivityReport.objects.filter(user=self.request.user).order_by('-start_date')


class TriggerReportGenerationView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        report_type = request.data.get('report_type', 'WEEKLY')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')

        if not start_date_str or not end_date_str:
            return Response(
                {"error": "Please provide start_date and end_date (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trigger Celery task
        generate_user_productivity_report.delay(
            request.user.id,
            report_type,
            start_date_str,
            end_date_str
        )

        return Response(
            {"message": f"{report_type} report generation task queued successfully."},
            status=status.HTTP_202_ACCEPTED
        )
