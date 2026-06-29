from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ChecklistItem, Task

def update_task_progress(task):
    items = task.checklist_items.all()
    total = items.count()
    if total > 0:
        completed = items.filter(is_completed=True).count()
        task.progress = int((completed / total) * 100)
    else:
        task.progress = 100 if task.status == Task.Status.COMPLETED else 0
    Task.objects.filter(id=task.id).update(progress=task.progress)

@receiver(post_save, sender=ChecklistItem)
@receiver(post_delete, sender=ChecklistItem)
def checklist_changed(sender, instance, **kwargs):
    update_task_progress(instance.task)

@receiver(post_save, sender=Task)
def task_status_changed(sender, instance, **kwargs):
    # Update progress if no checklists exist
    if not instance.checklist_items.exists():
        expected_progress = 100 if instance.status == Task.Status.COMPLETED else 0
        if instance.progress != expected_progress:
            Task.objects.filter(id=instance.id).update(progress=expected_progress)
            instance.progress = expected_progress
