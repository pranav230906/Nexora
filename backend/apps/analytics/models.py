from django.db import models
from django.conf import settings
from django.utils import timezone

class UserProductivityReport(models.Model):
    class ReportType(models.TextChoices):
        WEEKLY = 'WEEKLY', 'Weekly Report'
        MONTHLY = 'MONTHLY', 'Monthly Report'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='productivity_reports'
    )
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    productivity_score = models.PositiveIntegerField(default=0)
    tasks_completed = models.PositiveIntegerField(default=0)
    tasks_created = models.PositiveIntegerField(default=0)
    habit_consistency = models.FloatField(default=0.0) # Percentage (0-100)
    focus_hours = models.FloatField(default=0.0)
    ai_insights = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email} - {self.report_type} ({self.start_date} to {self.end_date})"


class DailyFocusLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_focus_logs'
    )
    date = models.DateField(default=timezone.now)
    focus_minutes = models.PositiveIntegerField(default=0)
    completed_tasks_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.email} - {self.date}: {self.focus_minutes} mins"
