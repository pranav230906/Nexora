from django.db import models
from django.conf import settings
from django.utils import timezone

class ActiveTaskManager(models.Manager):
    """
    Manager returning only non-soft-deleted tasks.
    """
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Tag(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=64)
    color = models.CharField(max_length=7, default='#3B82F6') # Hex Color Code

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name

class Task(models.Model):
    # Priority Options
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'

    # Status Options
    class Status(models.TextChoices):
        TODO = 'TODO', 'Todo'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        ARCHIVED = 'ARCHIVED', 'Archived'
        TRASH = 'TRASH', 'Trash'

    # Recurrence patterns
    class Recurrence(models.TextChoices):
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=24, choices=Priority.choices, default=Priority.MEDIUM)
    
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    due_date = models.DateTimeField(blank=True, null=True)
    
    # Time Tracking fields (stored in minutes)
    estimated_time = models.PositiveIntegerField(default=0)
    actual_time = models.PositiveIntegerField(default=0)
    
    # Subtasks self-referential relations
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    
    # Recurrence rules
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=24, choices=Recurrence.choices, blank=True, null=True)
    
    # Progress Calculation cache (calculated dynamically via checklist/subtasks)
    progress = models.PositiveIntegerField(default=0)

    # Soft Delete timestamps
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager() # Default manager
    active_objects = ActiveTaskManager() # Query filter manager

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.status = self.Status.TRASH
        self.save()

    def restore(self):
        self.deleted_at = None
        self.status = self.Status.TODO
        self.save()

    def __str__(self):
        return self.title

class ChecklistItem(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='checklist_items')
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} on {self.task.title}"

class Attachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
