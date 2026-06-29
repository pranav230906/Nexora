from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from apps.tasks.models import Task
from apps.goals_habits.models import Habit, HabitLog, Goal
from .models import UserProductivityReport, DailyFocusLog
from .tasks import generate_user_productivity_report, weekly_report_scheduler_task, monthly_report_scheduler_task

User = get_user_model()

class AnalyticsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='analyticsuser',
            email='analytics@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'analytics@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create mock tasks
        Task.objects.create(user=self.user, title="Task A", status="COMPLETED")
        Task.objects.create(user=self.user, title="Task B", status="TODO")

        # Create mock goals
        Goal.objects.create(user=self.user, title="Goal A", target_date=timezone.now().date(), is_completed=True)

        # Create mock daily focus logs
        DailyFocusLog.objects.create(user=self.user, date=timezone.now().date(), focus_minutes=120)

    def test_get_dashboard(self):
        url = reverse('analytics:dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 1 completed out of 2 total = 50%
        self.assertEqual(response.data['task_completion_rate'], 50.0)
        # 1 completed goal out of 1 total = 100%
        self.assertEqual(response.data['goal_success_rate'], 100.0)
        # 120 mins = 2.0 hours
        self.assertEqual(response.data['focus_hours'], 2.0)

    def test_trigger_report_api(self):
        url = reverse('analytics:trigger-report')
        data = {
            'report_type': 'WEEKLY',
            'start_date': '2026-06-20',
            'end_date': '2026-06-27'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

    def test_report_generation_task(self):
        result = generate_user_productivity_report(
            self.user.id,
            'WEEKLY',
            '2026-06-20',
            '2026-06-27'
        )
        self.assertIn("Report generated successfully", result)
        self.assertTrue(UserProductivityReport.objects.filter(user=self.user, report_type='WEEKLY').exists())

    def test_report_schedulers(self):
        res1 = weekly_report_scheduler_task()
        self.assertIn("Triggered weekly reports", res1)

        res2 = monthly_report_scheduler_task()
        self.assertIn("Triggered monthly reports", res2)
