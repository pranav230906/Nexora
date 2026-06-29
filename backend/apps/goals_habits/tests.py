from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, timedelta
from .models import Goal, Habit, HabitLog

User = get_user_model()

class GoalsHabitsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='goalsuser',
            email='goalsuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'goalsuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_goal_with_milestones(self):
        url = reverse('goals_habits:goal-list')
        data = {
            'title': 'Learn Django',
            'description': 'Master backend development',
            'target_date': '2026-12-31',
            'milestones': [
                {'title': 'Read Docs', 'is_completed': True},
                {'title': 'Build App', 'is_completed': False}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['progress'], 50)

    def test_habit_checkin_and_streak(self):
        # Create habit
        habit = Habit.objects.create(
            user=self.user,
            name='Daily Coding',
            frequency='DAILY'
        )
        
        # Check-in today
        today = date.today()
        url = reverse('goals_habits:habit-check-in', kwargs={'pk': habit.id})
        response = self.client.post(url, {'date': str(today)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_streak'], 1)

        # Check-in yesterday manually to verify streak calculations
        yesterday = today - timedelta(days=1)
        response = self.client.post(url, {'date': str(yesterday)}, format='json')
        self.assertEqual(response.data['current_streak'], 2)

    def test_heatmap_data(self):
        habit = Habit.objects.create(user=self.user, name='Drink Water')
        HabitLog.objects.create(habit=habit, date=date.today(), is_completed=True)
        
        url = reverse('goals_habits:habit-heatmap')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(str(date.today()), response.data)
        self.assertEqual(response.data[str(date.today())], 1)
