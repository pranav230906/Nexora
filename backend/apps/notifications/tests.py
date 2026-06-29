from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from apps.tasks.models import Task
from .models import NotificationPreference, NotificationLog, DeviceToken
from .tasks import deadline_alert_checker_task

User = get_user_model()

class NotificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='notifyuser',
            email='notifyuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'notifyuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_get_and_update_preferences(self):
        # GET Preferences (auto-creates)
        url = reverse('notifications:preferences')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['email_enabled'])

        # UPDATE Preferences
        data = {'email_enabled': False, 'push_enabled': False}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_enabled'])
        self.assertFalse(response.data['push_enabled'])

    def test_register_device_token(self):
        url = reverse('notifications:device-register')
        data = {'token': 'fcm-device-registration-token-string'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DeviceToken.objects.filter(user=self.user, token='fcm-device-registration-token-string').exists())

    def test_in_app_notification_logs(self):
        # Create Log
        log = NotificationLog.objects.create(
            user=self.user,
            title="Welcome!",
            message="Glad to have you here.",
            channel=NotificationLog.Channel.IN_APP,
            status=NotificationLog.Status.SENT
        )

        # Retrieve Logs
        url = reverse('notifications:logs-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertFalse(response.data[0]['read'])

        # Mark as read
        read_url = reverse('notifications:logs-mark-read', kwargs={'pk': log.id})
        response = self.client.post(read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log.refresh_from_db()
        self.assertTrue(log.read)

    def test_deadline_checker_task_generates_logs(self):
        # Create a task due in 5 hours (less than 24 hours)
        Task.objects.create(
            user=self.user,
            title="Important Project Presentation",
            description="Pitch deck submission.",
            due_date=timezone.now() + timezone.timedelta(hours=5),
            priority="urgent",
            status="TODO"
        )

        # Run task locally
        result = deadline_alert_checker_task()
        self.assertIn("Sent 1 alerts", result)

        # Check if logs were created for in-app alert
        in_app_log = NotificationLog.objects.filter(
            user=self.user,
            channel=NotificationLog.Channel.IN_APP,
            title="Deadline Alert: Important Project Presentation"
        ).first()
        self.assertIsNotNone(in_app_log)
