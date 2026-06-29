import logging
from django.db.models.signals import post_delete
from django.dispatch import receiver

from apps.tasks.models import Task
from apps.goals_habits.models import Habit, Goal
from .models import DeletedRecord

logger = logging.getLogger(__name__)

@receiver(post_delete, sender=Task)
def log_task_deletion(sender, instance, **kwargs):
    if instance.user:
        DeletedRecord.objects.create(
            user=instance.user,
            model_name='Task',
            object_id=str(instance.id)
        )
        logger.info(f"Logged task deletion: {instance.id} for user {instance.user.email}")


@receiver(post_delete, sender=Habit)
def log_habit_deletion(sender, instance, **kwargs):
    if instance.user:
        DeletedRecord.objects.create(
            user=instance.user,
            model_name='Habit',
            object_id=str(instance.id)
        )
        logger.info(f"Logged habit deletion: {instance.id} for user {instance.user.email}")


@receiver(post_delete, sender=Goal)
def log_goal_deletion(sender, instance, **kwargs):
    if instance.user:
        DeletedRecord.objects.create(
            user=instance.user,
            model_name='Goal',
            object_id=str(instance.id)
        )
        logger.info(f"Logged goal deletion: {instance.id} for user {instance.user.email}")
