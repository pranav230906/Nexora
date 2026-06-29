"""
Context builder for the AI Chat module.
Automatically collects relevant user data from existing Django models
to inject into AI prompts. Never duplicates models — queries existing ones.
"""
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


def get_user_tasks(user, limit: int = 15) -> str:
    """Retrieve user's active tasks with status, priority, and due dates."""
    try:
        from apps.tasks.models import Task
        tasks = Task.active_objects.filter(user=user).order_by('due_date', '-priority')[:limit]

        if not tasks.exists():
            return "No active tasks found."

        lines = []
        for t in tasks:
            due = t.due_date.strftime('%Y-%m-%d %H:%M') if t.due_date else 'No due date'
            overdue = ' ⚠️ OVERDUE' if t.due_date and t.due_date < timezone.now() and t.status != 'COMPLETED' else ''
            lines.append(
                f"- [{t.status}] \"{t.title}\" | Priority: {t.priority} | Due: {due}{overdue}"
            )
        return "**Active Tasks:**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_tasks error: {e}")
        return "Unable to retrieve tasks."


def get_user_goals(user, limit: int = 10) -> str:
    """Retrieve user's goals with milestone completion progress."""
    try:
        from apps.goals_habits.models import Goal
        goals = Goal.objects.filter(user=user).order_by('-created_at')[:limit]

        if not goals.exists():
            return "No goals found."

        lines = []
        for g in goals:
            total_milestones = g.milestones.count()
            completed_milestones = g.milestones.filter(is_completed=True).count()
            progress = f"{completed_milestones}/{total_milestones}" if total_milestones > 0 else "No milestones"
            status = "✅ Completed" if g.is_completed else "🔄 In Progress"
            lines.append(
                f"- {status} \"{g.title}\" | Target: {g.target_date} | Milestones: {progress}"
            )
        return "**Goals:**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_goals error: {e}")
        return "Unable to retrieve goals."


def get_user_habits(user, limit: int = 10) -> str:
    """Retrieve user's habits with current streaks."""
    try:
        from apps.goals_habits.models import Habit
        habits = Habit.objects.filter(user=user).order_by('-streak')[:limit]

        if not habits.exists():
            return "No habits found."

        lines = []
        for h in habits:
            lines.append(
                f"- \"{h.name}\" | Frequency: {h.frequency} | Current Streak: {h.streak} days | Best: {h.max_streak} days"
            )
        return "**Habits:**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_habits error: {e}")
        return "Unable to retrieve habits."


def get_user_calendar(user, days_ahead: int = 7) -> str:
    """Retrieve upcoming tasks with calendar mappings (next N days)."""
    try:
        from apps.tasks.models import Task
        now = timezone.now()
        upcoming = Task.active_objects.filter(
            user=user,
            due_date__gte=now,
            due_date__lte=now + timedelta(days=days_ahead),
        ).order_by('due_date')[:15]

        if not upcoming.exists():
            return f"No events scheduled in the next {days_ahead} days."

        lines = []
        for t in upcoming:
            due = t.due_date.strftime('%a %b %d, %H:%M') if t.due_date else 'TBD'
            lines.append(f"- \"{t.title}\" — {due} [{t.priority}]")
        return f"**Upcoming Schedule (Next {days_ahead} Days):**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_calendar error: {e}")
        return "Unable to retrieve calendar data."


def get_user_productivity(user) -> str:
    """Retrieve latest productivity analytics."""
    try:
        from apps.analytics.models import UserProductivityReport, DailyFocusLog
        from apps.tasks.models import Task

        # Latest report
        report = UserProductivityReport.objects.filter(user=user).order_by('-created_at').first()

        # Today's focus
        today = timezone.now().date()
        focus_log = DailyFocusLog.objects.filter(user=user, date=today).first()

        # Task counts
        total_tasks = Task.active_objects.filter(user=user).count()
        completed_tasks = Task.active_objects.filter(user=user, status='COMPLETED').count()
        overdue_tasks = Task.active_objects.filter(
            user=user, due_date__lt=timezone.now()
        ).exclude(status='COMPLETED').count()

        lines = []
        if report:
            lines.append(f"- Productivity Score: {report.productivity_score}%")
            lines.append(f"- Tasks Completed (period): {report.tasks_completed}")
            lines.append(f"- Habit Consistency: {report.habit_consistency:.1f}%")
            lines.append(f"- Focus Hours (period): {report.focus_hours:.1f}h")
        lines.append(f"- Total Active Tasks: {total_tasks}")
        lines.append(f"- Completed Tasks: {completed_tasks}")
        lines.append(f"- Overdue Tasks: {overdue_tasks}")
        if focus_log:
            lines.append(f"- Today's Focus: {focus_log.focus_minutes} minutes")
            lines.append(f"- Today's Completed: {focus_log.completed_tasks_count}")

        return "**Productivity Analytics:**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_productivity error: {e}")
        return "Unable to retrieve productivity data."


def get_user_notifications(user, limit: int = 5) -> str:
    """Retrieve recent unread notifications."""
    try:
        from apps.notifications.models import NotificationLog
        notifications = NotificationLog.objects.filter(
            user=user, read=False
        ).order_by('-created_at')[:limit]

        if not notifications.exists():
            return "No unread notifications."

        lines = []
        for n in notifications:
            lines.append(f"- [{n.channel}] \"{n.title}\": {n.message[:80]}")
        return "**Unread Notifications:**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_notifications error: {e}")
        return "Unable to retrieve notifications."


def get_user_gamification(user) -> str:
    """Retrieve user's gamification profile (XP, level, streak, achievements)."""
    try:
        from apps.gamification.models import UserGamificationProfile, UserAchievement
        profile = UserGamificationProfile.objects.filter(user=user).first()

        if not profile:
            return "No gamification profile found."

        achievements_count = UserAchievement.objects.filter(user=user).count()

        lines = [
            f"- Level: {profile.level}",
            f"- XP: {profile.xp}",
            f"- Coins: {profile.coins}",
            f"- Streak: {profile.streak_days} days",
            f"- Achievements Unlocked: {achievements_count}",
        ]
        return "**Gamification Profile:**\n" + "\n".join(lines)
    except Exception as e:
        logger.error(f"Context builder — get_user_gamification error: {e}")
        return "Unable to retrieve gamification data."


def build_full_context(user) -> str:
    """
    Aggregates all user context into a single structured string.
    Used for general productivity queries or when the tool router
    determines multiple tools should be called.
    """
    sections = [
        get_user_tasks(user),
        get_user_goals(user),
        get_user_habits(user),
        get_user_productivity(user),
        get_user_gamification(user),
        get_user_notifications(user),
    ]
    return "\n\n".join(sections)
