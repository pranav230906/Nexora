from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import ChatSession, ChatMessage

User = get_user_model()

class AIChatbotTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='chatuser',
            email='chatuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'chatuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_chat_session(self):
        url = reverse('ai_chatbot:session-list')
        data = {'title': 'Coding Session'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Coding Session')

    def test_retrieve_session_history(self):
        session = ChatSession.objects.create(user=self.user, title='Session A')
        ChatMessage.objects.create(session=session, sender=ChatMessage.Sender.USER, content='Hello')
        ChatMessage.objects.create(session=session, sender=ChatMessage.Sender.AI, content='Hi user')

        url = reverse('ai_chatbot:session-history', kwargs={'pk': session.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['content'], 'Hello')

    def test_suggested_prompts_endpoint(self):
        url = reverse('ai_chatbot:session-suggested-prompts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("suggested_prompts", response.data)
        self.assertGreater(len(response.data['suggested_prompts']), 0)
