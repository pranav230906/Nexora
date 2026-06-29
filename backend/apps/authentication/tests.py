from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class AuthTests(APITestCase):
    def test_user_registration(self):
        url = reverse('auth:register')
        data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'timezone': 'UTC'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_user_login(self):
        # Create user
        user = User.objects.create_user(
            username='loginuser',
            email='loginuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        data = {
            'email': 'loginuser@example.com',
            'password': 'SecurePassword123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
