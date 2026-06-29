import math
from django.db import models
from django.conf import settings
from django.utils import timezone

class UserGamificationProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gamification_profile'
    )
    xp = models.PositiveIntegerField(default=0)
    coins = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    streak_days = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    def calculate_level(self):
        # Level = int(xp^0.5 / 10) + 1
        # Example: 100 XP -> level 2, 400 XP -> level 3, 900 XP -> level 4
        return int(math.sqrt(self.xp) / 10) + 1

    def add_xp(self, amount):
        self.xp += amount
        new_level = self.calculate_level()
        leveled_up = new_level > self.level
        if leveled_up:
            self.level = new_level
        self.save()
        return leveled_up

    def add_coins(self, amount):
        self.coins += amount
        self.save()

    def update_streak(self):
        today = timezone.now().date()
        if self.last_active_date is None:
            self.streak_days = 1
        elif self.last_active_date == today:
            pass # Streak already updated today
        elif self.last_active_date == today - timezone.timedelta(days=1):
            self.streak_days += 1
        else:
            self.streak_days = 1 # Streak broken
        self.last_active_date = today
        self.save()

    def __str__(self):
        return f"{self.user.email} - Level {self.level} ({self.xp} XP)"


class Achievement(models.Model):
    class CriteriaType(models.TextChoices):
        COMPLETED_TASKS = 'COMPLETED_TASKS', 'Completed Tasks Count'
        HABIT_STREAKS = 'HABIT_STREAKS', 'Habit Streaks Count'
        TOTAL_LEVEL = 'TOTAL_LEVEL', 'Reached Level'
        COINS_EARNED = 'COINS_EARNED', 'Total Coins Earned'

    title = models.CharField(max_length=150)
    description = models.TextField()
    icon_name = models.CharField(max_length=50, default='award')
    xp_reward = models.PositiveIntegerField(default=50)
    coins_reward = models.PositiveIntegerField(default=20)
    criteria_type = models.CharField(max_length=50, choices=CriteriaType.choices)
    target_value = models.PositiveIntegerField()

    def __str__(self):
        return f"Achievement: {self.title} (Target: {self.target_value} {self.criteria_type})"


class UserAchievement(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='unlocked_achievements'
    )
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'achievement')

    def __str__(self):
        return f"{self.user.email} unlocked {self.achievement.title}"


class Challenge(models.Model):
    class Type(models.TextChoices):
        DAILY = 'DAILY', 'Daily Mission'
        WEEKLY = 'WEEKLY', 'Weekly Mission'

    class CriteriaType(models.TextChoices):
        COMPLETED_TASKS = 'COMPLETED_TASKS', 'Complete Tasks'
        HABIT_STREAKS = 'HABIT_STREAKS', 'Habit Logging'

    title = models.CharField(max_length=150)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=Type.choices)
    criteria_type = models.CharField(max_length=50, choices=CriteriaType.choices)
    target_value = models.PositiveIntegerField()
    xp_reward = models.PositiveIntegerField(default=30)
    coins_reward = models.PositiveIntegerField(default=15)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()

    def is_active(self):
        now = timezone.now()
        return self.start_date <= now <= self.end_date

    def __str__(self):
        return f"[{self.type}] {self.title} (Target: {self.target_value})"


class UserChallengeProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenge_progresses'
    )
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    current_value = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'challenge')

    def increment(self, amount=1):
        if self.is_completed:
            return False

        self.current_value += amount
        if self.current_value >= self.challenge.target_value:
            self.current_value = self.challenge.target_value
            self.is_completed = True
            self.completed_at = timezone.now()
            
            # Award rewards
            profile, _ = UserGamificationProfile.objects.get_or_create(user=self.user)
            profile.add_xp(self.challenge.xp_reward)
            profile.add_coins(self.challenge.coins_reward)
            return True
        self.save()
        return False

    def __str__(self):
        return f"{self.user.email} - {self.challenge.title} ({self.current_value}/{self.challenge.target_value})"
