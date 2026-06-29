from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from .models import GoogleCalendarCredential, GoogleCalendarEventMapping
from apps.tasks.models import Task

User = get_user_model()

class GoogleCalendarTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='caluser',
            email='caluser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'caluser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_save_calendar_credentials(self):
        # Directly test saving record since OAuth redirect requires mock network requests
        cred = GoogleCalendarCredential.objects.create(
            user=self.user,
            access_token='access_token_123',
            refresh_token='refresh_token_123',
            token_expiry=timezone.now() + timezone.timedelta(hours=1)
        )
        self.assertEqual(cred.user.email, 'caluser@example.com')

    def test_calendar_status_unlinked(self):
        url = reverse('google_calendar:status')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['connected'], False)

    def test_calendar_status_linked(self):
        GoogleCalendarCredential.objects.create(
            user=self.user,
            access_token='access_token_123',
            token_expiry=timezone.now() + timezone.timedelta(hours=1)
        )
        url = reverse('google_calendar:status')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['connected'], True)
