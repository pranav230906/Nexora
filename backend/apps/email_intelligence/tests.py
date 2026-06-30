from unittest.mock import patch
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tasks.models import Task
from apps.email_intelligence.models import GmailCredential, SyncedEmail
from services.email_intelligence import (
    email_parser,
    ai_email_analyzer,
    entity_extractor
)

User = get_user_model()


class OAuthFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='oauthuser',
            email='oauth@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'oauth@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_gmail_connect_url_generation(self):
        url = reverse('email_intelligence:connect')
        response = self.client.post(url, {'redirect_uri': 'http://localhost:3000/callback'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('authorization_url', response.data)


class EmailParsingTests(APITestCase):
    def test_mime_decode(self):
        raw = {
            'id': 'msg_123',
            'threadId': 'thread_123',
            'payload': {
                'mimeType': 'text/plain',
                'headers': [
                    {'name': 'Subject', 'value': 'Project Deadline warning'},
                    {'name': 'From', 'value': 'team@nexora.ai'}
                ],
                'body': {'data': 'SGVsbG8sIHRoaXMgaXMgYW4gYWN0aW9uIGl0ZW0='}  # "Hello, this is an action item"
            }
        }
        parsed = email_parser.parse_raw_message(raw)
        self.assertEqual(parsed['subject'], 'Project Deadline warning')
        self.assertEqual(parsed['from'], 'team@nexora.ai')
        self.assertEqual(parsed['body'], 'Hello, this is an action item')


class AIAnalyzerTests(APITestCase):
    def test_relevance_fallback_actionable(self):
        res = ai_email_analyzer._fallback_relevance(
            "Urgent: Pay electricity bill due tomorrow",
            "Hi, please submit the pending payment details by 5 PM tomorrow."
        )
        self.assertTrue(res['is_actionable'])
        self.assertEqual(res['category'], 'BILL_PAYMENT')

    def test_relevance_fallback_non_actionable(self):
        res = ai_email_analyzer._fallback_relevance(
            "Weekly newsletter summary",
            "Here is your weekly recap of nexora updates."
        )
        self.assertFalse(res['is_actionable'])


class ActionGeneratorTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='actionuser',
            email='action@example.com',
            password='SecurePassword123!'
        )

    def test_generate_task_success(self):
        from services.email_intelligence import action_generator
        entities = {
            "title": "Pay invoice 44",
            "description": "Electricity pending bill",
            "due_date": timezone.now().isoformat(),
            "duration_minutes": 30,
            "priority": "HIGH",
            "schedule_calendar": False
        }
        task, event_id = action_generator.generate_productivity_actions(self.user, entities, "msg_99")
        self.assertIsNotNone(task)
        self.assertEqual(task.title, "Pay invoice 44")
        self.assertEqual(task.priority, "HIGH")


class EmailIntelligenceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'api@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_gmail_status_disconnected(self):
        url = reverse('email_intelligence:status')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['connected'])

    def test_sync_history_empty(self):
        url = reverse('email_intelligence:sync-history')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_synced_emails'], 0)
