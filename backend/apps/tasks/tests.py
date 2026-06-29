from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Task, Tag

User = get_user_model()

class TaskTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='taskuser',
            email='taskuser@example.com',
            password='SecurePassword123!'
        )
        # Obtain token
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'taskuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_tag(self):
        url = reverse('tasks:tag-list')
        data = {'name': 'Work', 'color': '#FF5733'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Work')

    def test_create_task(self):
        url = reverse('tasks:task-list')
        data = {
            'title': 'Test Task',
            'description': 'Description here',
            'priority': 'HIGH',
            'checklist_items': [
                {'title': 'Subtask checklist 1', 'is_completed': False},
                {'title': 'Subtask checklist 2', 'is_completed': True}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Task')
        
        # Verify dynamic progress calculations (1 of 2 is completed = 50%)
        self.assertEqual(response.data['progress'], 50)
