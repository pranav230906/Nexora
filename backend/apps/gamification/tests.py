from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from apps.tasks.models import Task
from apps.goals_habits.models import Habit, HabitLog
from .models import UserGamificationProfile, Achievement, UserAchievement, Challenge, UserChallengeProgress
from .tasks import reset_daily_challenges_task, reset_weekly_challenges_task, streak_decay_checker_task

User = get_user_model()

class GamificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='gameuser',
            email='gameuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'gameuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create baseline achievements
        self.achievement_tasks = Achievement.objects.create(
            title="First Task Completed",
            description="Complete your first task.",
            icon_name="award",
            xp_reward=50,
            coins_reward=20,
            criteria_type=Achievement.CriteriaType.COMPLETED_TASKS,
            target_value=1
        )

        # Create active Daily challenge
        self.challenge = Challenge.objects.create(
            title="Daily Achiever",
            description="Complete 1 task today.",
            type=Challenge.Type.DAILY,
            criteria_type=Challenge.CriteriaType.COMPLETED_TASKS,
            target_value=1,
            xp_reward=40,
            coins_reward=20,
            start_date=timezone.now() - timezone.timedelta(hours=1),
            end_date=timezone.now() + timezone.timedelta(hours=10)
        )

    def test_get_profile(self):
        url = reverse('gamification:profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['xp'], 0)
        self.assertEqual(response.data['level'], 1)

    def test_task_completion_rewards_and_signals(self):
        # Create a task
        task = Task.objects.create(
            user=self.user,
            title="Perform diagnostic check",
            priority="high",
            status="TODO"
        )

        # Mark completed to fire signal
        task.status = "COMPLETED"
        task.save()

        # Profile check
        profile = UserGamificationProfile.objects.get(user=self.user)
        # High priority gives 20 base XP + 10 bonus XP = 30 XP
        # Base coins: 10 + 5 bonus = 15 coins
        self.assertEqual(profile.xp, 30)
        self.assertEqual(profile.coins, 15)

        # Check achievement unlock
        self.assertTrue(UserAchievement.objects.filter(user=self.user, achievement=self.achievement_tasks).exists())

        # Check challenge progression
        progress = UserChallengeProgress.objects.get(user=self.user, challenge=self.challenge)
        self.assertTrue(progress.is_completed)

        # Challenge rewards: 40 XP + 20 coins
        # Profile final: 30 + 40 = 70 XP; 15 + 20 = 35 coins
        profile.refresh_from_db()
        self.assertEqual(profile.xp, 70)
        self.assertEqual(profile.coins, 35)

    def test_habit_logged_rewards(self):
        habit = Habit.objects.create(
            user=self.user,
            name="Daily Stretching",
            frequency="DAILY"
        )
        # Log habit record
        HabitLog.objects.create(habit=habit, date=timezone.now().date(), is_completed=True)

        profile = UserGamificationProfile.objects.get(user=self.user)
        self.assertEqual(profile.xp, 15)
        self.assertEqual(profile.coins, 5)

    def test_leaderboard(self):
        # Create another user and give them high XP
        other_user = User.objects.create_user(
            username='champ',
            email='champ@example.com',
            password='SecurePassword123!'
        )
        other_profile, _ = UserGamificationProfile.objects.get_or_create(user=other_user)
        other_profile.xp = 500
        other_profile.level = 5
        other_profile.save()

        url = reverse('gamification:leaderboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # First should be the champ
        self.assertEqual(response.data[0]['email'], 'champ@example.com')
        self.assertEqual(response.data[0]['rank'], 1)

    def test_celery_reset_tasks(self):
        res1 = reset_daily_challenges_task()
        self.assertEqual(res1, "Daily challenges reset successfully.")

        res2 = reset_weekly_challenges_task()
        self.assertEqual(res2, "Weekly challenges reset successfully.")

        # Test streak decay
        profile = UserGamificationProfile.objects.get(user=self.user)
        profile.streak_days = 5
        profile.last_active_date = timezone.now().date() - timezone.timedelta(days=3)
        profile.save()

        res3 = streak_decay_checker_task()
        profile.refresh_from_db()
        self.assertEqual(profile.streak_days, 0)
