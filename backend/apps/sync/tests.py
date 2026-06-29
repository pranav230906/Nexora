from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from apps.tasks.models import Task
from apps.goals_habits.models import Habit
from .models import DeletedRecord, SyncLog

User = get_user_model()

class SyncTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='syncuser',
            email='syncuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'syncuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create baseline Task
        self.task = Task.objects.create(
            user=self.user,
            title="Read through sync docs",
            status="TODO"
        )

    def test_deleted_tombstone_logged_on_hard_delete(self):
        task_id = self.task.id
        self.task.delete()

        self.assertTrue(DeletedRecord.objects.filter(
            user=self.user,
            model_name='Task',
            object_id=str(task_id)
        ).exists())

    def test_sync_post_ops_create_and_update(self):
        url = reverse('sync:sync-endpoint')
        
        # Test CREATE queue payload
        # Note: timezone format matching datetime serializer
        client_timestamp = timezone.now().isoformat()
        
        queue = [
            {
                'action': 'CREATE',
                'model_name': 'Task',
                'object_id': '999',
                'client_timestamp': client_timestamp,
                'data': {
                    'title': 'Offline created task',
                    'status': 'TODO'
                }
            },
            {
                'action': 'UPDATE',
                'model_name': 'Task',
                'object_id': str(self.task.id),
                # Newer timestamp than record updated_at (which is set at setUp time)
                'client_timestamp': (timezone.now() + timezone.timedelta(seconds=5)).isoformat(),
                'data': {
                    'title': 'Updated title from offline',
                    'status': 'IN_PROGRESS'
                }
            }
        ]

        data = {
            'device_id': 'mobile-test',
            'last_sync_time': (timezone.now() - timezone.timedelta(minutes=5)).isoformat(),
            'queue': queue
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['operations_applied'], 2)

        # Verify task created
        self.assertTrue(Task.objects.filter(user=self.user, title='Offline created task').exists())

        # Verify task updated
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Updated title from offline')
        self.assertEqual(self.task.status, 'IN_PROGRESS')

        # Verify sync log created
        self.assertTrue(SyncLog.objects.filter(user=self.user, device_id='mobile-test').exists())

    def test_conflict_resolution_server_wins(self):
        url = reverse('sync:sync-endpoint')
        
        # Older timestamp than record's current updated_at time
        old_client_timestamp = (timezone.now() - timezone.timedelta(minutes=10)).isoformat()
        
        queue = [
            {
                'action': 'UPDATE',
                'model_name': 'Task',
                'object_id': str(self.task.id),
                'client_timestamp': old_client_timestamp,
                'data': {
                    'title': 'Stale title update',
                }
            }
        ]

        data = {
            'device_id': 'mobile-test',
            'last_sync_time': (timezone.now() - timezone.timedelta(minutes=5)).isoformat(),
            'queue': queue
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['operations_applied'], 0) # Discarded (Server wins)

        # Verify task not modified
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Read through sync docs')
