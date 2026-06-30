"""
Progress tracking service. Aggregates metrics from tasks, habits,
streaks, and productivity scores to feed into the accountability partner.
"""
from typing import Dict
from django.utils import timezone
from apps.tasks.models import Task
from apps.goals_habits.models import HabitLog, Habit
from apps.gamification.models import UserGamificationProfile


def get_user_progress_summary(user) -> Dict:
    """
    Queries database logs and gamification profiles to aggregate
    productivity indicators.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Task metrics
    today_tasks = Task.active_objects.filter(user=user, due_date__gte=today_start)
    total_today = today_tasks.count()
    completed_today = today_tasks.filter(status=Task.Status.COMPLETED).count()

    # 2. Habit metrics
    active_habits = Habit.objects.filter(user=user)
    completed_habits_today = HabitLog.objects.filter(
        habit__user=user, 
        date=today_start.date()
    ).count()

    # 3. Gamification profile metrics
    try:
        profile = UserGamificationProfile.objects.get(user=user)
        streak = profile.streak
        xp = profile.xp
        level = profile.level
    except UserGamificationProfile.DoesNotExist:
        streak = 0
        xp = 0
        level = 1

    # 4. Productivity score calculation
    productivity_score = 0
    if total_today > 0:
        productivity_score += int((completed_today / total_today) * 60)
    if active_habits.exists():
        productivity_score += int((completed_habits_today / active_habits.count()) * 40)
    
    # Floor/cap
    productivity_score = min(max(productivity_score, 0), 100)

    return {
        "tasks_total_today": total_today,
        "tasks_completed_today": completed_today,
        "habits_completed_today": completed_habits_today,
        "streak_days": streak,
        "gamification_xp": xp,
        "gamification_level": level,
        "productivity_score": productivity_score
    }
