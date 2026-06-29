import logging
from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Sum

from .models import UserProductivityReport, DailyFocusLog
from apps.tasks.models import Task
from apps.goals_habits.models import Habit, HabitLog
from services.ai.agents import ProductivityCoach

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task
def generate_user_productivity_report(user_id, report_type, start_date_str, end_date_str):
    """
    Asynchronously aggregates user database statistics, calls the AI Coach
    for personalized insights, and saves the UserProductivityReport.
    """
    try:
        user = User.objects.get(id=user_id)
        start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()

        # 1. Gather Task Stats
        tasks_created = Task.objects.filter(
            user=user,
            created_at__date__range=[start_date, end_date]
        ).count()
        
        tasks_completed = Task.objects.filter(
            user=user,
            status='COMPLETED',
            updated_at__date__range=[start_date, end_date]
        ).count()

        # 2. Gather Habit Stats
        total_habits = Habit.objects.filter(user=user).count()
        days_in_range = (end_date - start_date).days + 1
        
        habit_logs_count = HabitLog.objects.filter(
            habit__user=user,
            is_completed=True,
            date__range=[start_date, end_date]
        ).count()

        expected_habit_logs = total_habits * days_in_range
        habit_consistency = (
            (habit_logs_count / expected_habit_logs * 100.0)
            if expected_habit_logs > 0 else 100.0
        )
        habit_consistency = min(100.0, max(0.0, habit_consistency))

        # 3. Gather Focus Hours Stats
        focus_minutes = DailyFocusLog.objects.filter(
            user=user,
            date__range=[start_date, end_date]
        ).aggregate(total=Sum('focus_minutes'))['total'] or 0
        focus_hours = float(focus_minutes) / 60.0

        # 4. Calculate Productivity Score (Clamped 0 - 100)
        completion_rate = (tasks_completed / tasks_created * 100.0) if tasks_created > 0 else 100.0
        # Formula: 40% completion rate + 40% habit consistency + 20% focus hours (clamped at 20 hours target)
        focus_target_hours = 15.0 if report_type == 'WEEKLY' else 60.0
        focus_ratio = min(1.0, focus_hours / focus_target_hours) * 100.0
        
        productivity_score = int(
            (completion_rate * 0.4) + 
            (habit_consistency * 0.4) + 
            (focus_ratio * 0.2)
        )
        productivity_score = min(100, max(0, productivity_score))

        # 5. Call AI Coach for insights
        ai_insights = "Great job maintaining focus! Keep logging habits to build consistency."
        try:
            coach = ProductivityCoach()
            user_summary_prompt = (
                f"User Email: {user.email}\n"
                f"Report Type: {report_type}\n"
                f"Date range: {start_date} to {end_date}\n"
                f"Tasks Created: {tasks_created}\n"
                f"Tasks Completed: {tasks_completed}\n"
                f"Habit Consistency: {habit_consistency:.1f}%\n"
                f"Total Focus Hours: {focus_hours:.1f} hours\n"
                f"Calculated Productivity Score: {productivity_score}/100\n"
                f"Please generate 3 actionable productivity coaching tips based on these numbers."
            )
            ai_response = coach.call(user_summary_prompt)
            if ai_response:
                ai_insights = ai_response
        except Exception as e:
            logger.warning(f"AI Coach insights failed: {e}")

        # 6. Save Report
        report = UserProductivityReport.objects.create(
            user=user,
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
            productivity_score=productivity_score,
            tasks_completed=tasks_completed,
            tasks_created=tasks_created,
            habit_consistency=habit_consistency,
            focus_hours=focus_hours,
            ai_insights=ai_insights
        )

        return f"Report generated successfully for user {user.email} (ID: {report.id})"

    except Exception as exc:
        logger.error(f"Failed to generate productivity report: {exc}")
        raise exc


@shared_task
def weekly_report_scheduler_task():
    """
    Weekly cron task running via Celery Beat (e.g. Sunday midnight).
    Generates weekly reports for all active users.
    """
    today = timezone.now().date()
    start_date = today - timezone.timedelta(days=7)
    end_date = today - timezone.timedelta(days=1)
    
    users = User.objects.filter(is_active=True)
    for u in users:
        generate_user_productivity_report.delay(
            u.id, 
            'WEEKLY', 
            start_date.strftime('%Y-%m-%d'), 
            end_date.strftime('%Y-%m-%d')
        )
    return f"Triggered weekly reports queue for {users.count()} users."


@shared_task
def monthly_report_scheduler_task():
    """
    Monthly cron task running via Celery Beat (e.g. 1st of month).
    """
    today = timezone.now().date()
    # Approximate last month range
    start_date = today - timezone.timedelta(days=30)
    end_date = today - timezone.timedelta(days=1)
    
    users = User.objects.filter(is_active=True)
    for u in users:
        generate_user_productivity_report.delay(
            u.id, 
            'MONTHLY', 
            start_date.strftime('%Y-%m-%d'), 
            end_date.strftime('%Y-%m-%d')
        )
    return f"Triggered monthly reports queue for {users.count()} users."
