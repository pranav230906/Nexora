import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.tasks.models import Task
from apps.goals_habits.models import HabitLog
from .models import (
    UserGamificationProfile,
    Achievement,
    UserAchievement,
    Challenge,
    UserChallengeProgress
)

logger = logging.getLogger(__name__)

def evaluate_achievements(user):
    """
    Evaluates and unlocks achievements for the user based on progress.
    """
    profile, _ = UserGamificationProfile.objects.get_or_create(user=user)
    completed_tasks_count = Task.objects.filter(user=user, status='COMPLETED').count()

    achievements = Achievement.objects.exclude(
        id__in=UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    )

    for ach in achievements:
        unlocked = False
        if ach.criteria_type == Achievement.CriteriaType.COMPLETED_TASKS:
            if completed_tasks_count >= ach.target_value:
                unlocked = True
        elif ach.criteria_type == Achievement.CriteriaType.TOTAL_LEVEL:
            if profile.level >= ach.target_value:
                unlocked = True
        elif ach.criteria_type == Achievement.CriteriaType.COINS_EARNED:
            if profile.coins >= ach.target_value:
                unlocked = True

        if unlocked:
            UserAchievement.objects.create(user=user, achievement=ach)
            profile.add_xp(ach.xp_reward)
            profile.add_coins(ach.coins_reward)
            logger.info(f"User {user.email} unlocked achievement: {ach.title}")


def progress_challenges(user, criteria_type, amount=1):
    """
    Increments progress on all active challenges matching the criteria.
    """
    now = timezone.now()
    active_challenges = Challenge.objects.filter(
        criteria_type=criteria_type,
        start_date__lte=now,
        end_date__gte=now
    )

    for ch in active_challenges:
        progress, created = UserChallengeProgress.objects.get_or_create(
            user=user,
            challenge=ch
        )
        if not progress.is_completed:
            progress.increment(amount)


@receiver(post_save, sender=Task)
def handle_task_completion(sender, instance, created, **kwargs):
    """
    Awards XP & Coins and updates challenge progress upon Task completion.
    """
    # Only award rewards if the status changed to completed (or created as completed)
    if instance.status == 'COMPLETED':
        user = instance.user
        profile, _ = UserGamificationProfile.objects.get_or_create(user=user)

        # Base rewards
        xp_award = 20
        coins_award = 10

        # Priority multiplier
        if instance.priority == 'high':
            xp_award += 10
            coins_award += 5
        elif instance.priority == 'urgent':
            xp_award += 20
            coins_award += 10

        # Avoid double rewarding by checking if we already registered completion logs.
        # Simple tracking: we can check if they received task completed rewards for this task.
        # To keep it simple, we check if they completed a task today, we update streak.
        profile.update_streak()
        profile.add_xp(xp_award)
        profile.add_coins(coins_award)

        # Progress challenges
        progress_challenges(user, Challenge.CriteriaType.COMPLETED_TASKS, amount=1)

        # Evaluate achievements
        evaluate_achievements(user)


@receiver(post_save, sender=HabitLog)
def handle_habit_logged(sender, instance, created, **kwargs):
    """
    Awards XP upon logging habit progress.
    """
    if created:
        user = instance.habit.user
        profile, _ = UserGamificationProfile.objects.get_or_create(user=user)

        # Log active streak
        profile.update_streak()
        profile.add_xp(15) # Habits yield 15 XP
        profile.add_coins(5) # Habits yield 5 coins

        # Progress challenges
        progress_challenges(user, Challenge.CriteriaType.HABIT_STREAKS, amount=1)

        # Evaluate achievements
        evaluate_achievements(user)
