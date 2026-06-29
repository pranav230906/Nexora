import logging
from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import UserGamificationProfile, Challenge

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task
def reset_daily_challenges_task():
    """
    Cleans up old daily challenges and creates new ones for the day.
    """
    now = timezone.now()
    today_end = timezone.now().replace(hour=23, minute=59, second=59, microsecond=999999)

    # Deactivate expired daily challenges
    Challenge.objects.filter(type=Challenge.Type.DAILY, end_date__lt=now).delete()

    # Create new standard daily challenges
    Challenge.objects.create(
        title="Daily Achiever",
        description="Complete 3 tasks today to earn extra rewards.",
        type=Challenge.Type.DAILY,
        criteria_type=Challenge.CriteriaType.COMPLETED_TASKS,
        target_value=3,
        xp_reward=40,
        coins_reward=20,
        start_date=now,
        end_date=today_end
    )
    
    Challenge.objects.create(
        title="Habit Builder",
        description="Log at least 1 habit check-in today.",
        type=Challenge.Type.DAILY,
        criteria_type=Challenge.CriteriaType.HABIT_STREAKS,
        target_value=1,
        xp_reward=30,
        coins_reward=15,
        start_date=now,
        end_date=today_end
    )

    logger.info("Daily challenges reset successfully.")
    return "Daily challenges reset successfully."


@shared_task
def reset_weekly_challenges_task():
    """
    Cleans up old weekly challenges and creates new ones.
    """
    now = timezone.now()
    week_end = now + timezone.timedelta(days=7)

    Challenge.objects.filter(type=Challenge.Type.WEEKLY, end_date__lt=now).delete()

    Challenge.objects.create(
        title="Weekly Warrior",
        description="Complete 15 tasks this week.",
        type=Challenge.Type.WEEKLY,
        criteria_type=Challenge.CriteriaType.COMPLETED_TASKS,
        target_value=15,
        xp_reward=150,
        coins_reward=75,
        start_date=now,
        end_date=week_end
    )

    logger.info("Weekly challenges reset successfully.")
    return "Weekly challenges reset successfully."


@shared_task
def streak_decay_checker_task():
    """
    Periodic task running nightly.
    Decays or resets active streaks to 0 if the user has been inactive for > 48 hours.
    """
    yesterday = timezone.now().date() - timezone.timedelta(days=1)
    
    # Reset streak if user hasn't completed any task or habit record since yesterday
    profiles = UserGamificationProfile.objects.filter(
        last_active_date__lt=yesterday
    )
    
    updated_count = profiles.update(streak_days=0)
    logger.info(f"Streak checker complete. Reset {updated_count} user streaks.")
    return f"Reset {updated_count} user streaks."
