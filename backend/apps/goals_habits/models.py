from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Goal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    target_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Milestone(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Habit(models.Model):
    class Frequency(models.TextChoices):
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    frequency = models.CharField(max_length=24, choices=Frequency.choices, default=Frequency.DAILY)
    
    # Cached streak calculations
    streak = models.PositiveIntegerField(default=0)
    max_streak = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def recalculate_streak(self):
        """
        Scans HabitLog entries back in time starting from today or yesterday
        to compute the current active consecutive day check-in streak.
        """
        logs = self.logs.filter(is_completed=True).order_range_dates = self.logs.filter(is_completed=True).order_by('-date')
        if not logs.exists():
            self.streak = 0
            self.save(update_fields=['streak'])
            return

        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        log_dates = sorted(list(set([log.date for log in logs])), reverse=True)
        
        # Streak can start today or yesterday
        if log_dates[0] != today and log_dates[0] != yesterday:
            self.streak = 0
            self.save(update_fields=['streak'])
            return

        current_streak = 1
        for idx in range(len(log_dates) - 1):
            diff = log_dates[idx] - log_dates[idx + 1]
            if diff.days == 1:
                current_streak += 1
            elif diff.days > 1:
                break # Streak is broken

        self.streak = current_streak
        if current_streak > self.max_streak:
            self.max_streak = current_streak
        self.save(update_fields=['streak', 'max_streak'])

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField(default=timezone.now)
    is_completed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('habit', 'date')

    def __str__(self):
        return f"{self.habit.name} logged on {self.date}"
