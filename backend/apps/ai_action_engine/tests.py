from unittest.mock import patch
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tasks.models import Task, Tag
from services.ai_action_engine import (
    intent_detector,
    entity_parser,
    task_extractor,
    reminder_strategy
)

User = get_user_model()


class IntentDetectionTests(APITestCase):
    def test_complete_intent_fallback(self):
        result = intent_detector._fallback_detect_intent("I finished my homework assignment")
        self.assertEqual(result['intent'], 'COMPLETE_TASK')

    def test_create_intent_fallback(self):
        result = intent_detector._fallback_detect_intent("remind me to call Rahul tomorrow at 5 PM")
        self.assertEqual(result['intent'], 'CREATE_TASK')

    def test_planning_intent_fallback(self):
        result = intent_detector._fallback_detect_intent("schedule time block focus session today")
        self.assertEqual(result['intent'], 'PLANNING')


class EntityParsingTests(APITestCase):
    def test_fallback_parsing(self):
        entities = entity_parser._fallback_entities("Prepare for exam urgent two hours")
        self.assertEqual(entities["priority"], "URGENT")
        self.assertEqual(entities["estimated_time"], 120)
        self.assertIn("Prepare", entities["title"])


class TaskExtractionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='extractuser',
            email='extract@example.com',
            password='SecurePassword123!'
        )

    def test_task_extraction_missing_due_date(self):
        task, follow_up = task_extractor.extract_and_create_task(self.user, "Read books")
        self.assertNil = task is None
        self.assertIn("What date or time", follow_up)


class ReminderStrategyTests(APITestCase):
    def test_escalation_levels(self):
        user = User.objects.create_user(username='remuser', email='rem@example.com')
        task = Task.objects.create(user=user, title="Critical task", status='TODO')
        
        # Under 2 hours -> Level 5
        level = reminder_strategy.get_escalation_level(task, 1.5)
        self.assertEqual(level, 5)
        
        # Overdue -> Level 6
        level = reminder_strategy.get_escalation_level(task, -0.5)
        self.assertEqual(level, 6)


class ActionEngineAPITests(APITestCase):
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

    def test_process_input_endpoint_create(self):
        url = reverse('ai_action_engine:process-input')
        response = self.client.post(url, {'text': 'Remind me tomorrow at 4 PM to complete DBMS assignment'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('intent', response.data)

    def test_verify_task_endpoint_not_found(self):
        url = reverse('ai_action_engine:verify-task')
        response = self.client.post(url, {'task_id': 9999, 'submission_text': 'I did it'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_accountability_endpoint(self):
        url = reverse('ai_action_engine:accountability') + '?phase=MORNING_PLANNING'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_replan_endpoint(self):
        url = reverse('ai_action_engine:replan-day')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('schedule', response.data)
