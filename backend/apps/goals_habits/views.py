from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta, datetime
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Goal, Habit, HabitLog
from .serializers import GoalSerializer, HabitSerializer, HabitLogSerializer

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).prefetch_related('milestones')


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user).prefetch_related('logs')

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """
        Check-in endpoint allowing users to mark a habit completed for a specific date (default: today).
        """
        habit = self.get_object()
        date_str = request.data.get('date')
        is_completed = request.data.get('is_completed', True)

        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            date = timezone.now().date()

        log, created = HabitLog.objects.get_or_create(habit=habit, date=date)
        log.is_completed = is_completed
        log.save()

        # Recalculate streak counters
        habit.recalculate_streak()

        return Response({
            "message": "Habit check-in status registered.",
            "date": str(date),
            "is_completed": log.is_completed,
            "current_streak": habit.streak,
            "max_streak": habit.max_streak
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def daily_status(self, request):
        """
        Returns a list of all habits and checks if they were completed today.
        """
        today = timezone.now().date()
        habits = self.get_queryset()
        
        status_list = []
        for habit in habits:
            log_today = habit.logs.filter(date=today, is_completed=True).exists()
            status_list.append({
                "id": habit.id,
                "name": habit.name,
                "frequency": habit.frequency,
                "completed_today": log_today,
                "streak": habit.streak
            })

        return Response(status_list, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """
        Aggregates habit logs over the last year to supply calendar heatmap datasets.
        """
        one_year_ago = timezone.now().date() - timedelta(days=365)
        
        # Get count of completed logs grouped by date
        logs = HabitLog.objects.filter(
            habit__user=request.user,
            date__gte=one_year_ago,
            is_completed=True
        ).values('date').annotate(count=Count('id')).order_by('date')

        heatmap_data = {str(log['date']): log['count'] for log in logs}
        return Response(heatmap_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Returns summary goals and habits statistics.
        """
        habits = self.get_queryset()
        goals = Goal.objects.filter(user=request.user)

        total_habits = habits.count()
        total_goals = goals.count()

        completed_goals = goals.filter(is_completed=True).count()
        
        best_streak = 0
        total_logs = 0
        completed_logs = 0
        
        for h in habits:
            if h.max_streak > best_streak:
                best_streak = h.max_streak
            total_logs += h.logs.count()
            completed_logs += h.logs.filter(is_completed=True).count()

        completion_rate = int((completed_logs / total_logs) * 100) if total_logs > 0 else 0
        goal_rate = int((completed_goals / total_goals) * 100) if total_goals > 0 else 0

        return Response({
            "total_habits": total_habits,
            "total_goals": total_goals,
            "completed_goals": completed_goals,
            "goal_completion_rate": goal_rate,
            "habit_completion_rate": completion_rate,
            "best_streak": best_streak,
        }, status=status.HTTP_200_OK)
