from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from .models import ChatSession, ChatMessage
from apps.tasks.models import Task
from apps.goals_habits.models import Goal, Habit

User = get_user_model()


class ChatSessionCRUDTests(APITestCase):
    """Tests for session CRUD operations."""

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

    def test_list_chat_sessions(self):
        ChatSession.objects.create(user=self.user, title='Session A')
        ChatSession.objects.create(user=self.user, title='Session B')
        url = reverse('ai_chatbot:session-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_rename_chat_session(self):
        session = ChatSession.objects.create(user=self.user, title='Old Title')
        url = reverse('ai_chatbot:session-detail', kwargs={'pk': session.id})
        response = self.client.patch(url, {'title': 'New Title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'New Title')

    def test_delete_chat_session(self):
        session = ChatSession.objects.create(user=self.user, title='Delete Me')
        url = reverse('ai_chatbot:session-detail', kwargs={'pk': session.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ChatSession.objects.filter(id=session.id).exists())

    def test_retrieve_session_history(self):
        session = ChatSession.objects.create(user=self.user, title='Session A')
        ChatMessage.objects.create(session=session, sender=ChatMessage.Sender.USER, content='Hello')
        ChatMessage.objects.create(session=session, sender=ChatMessage.Sender.AI, content='Hi user')

        url = reverse('ai_chatbot:session-history', kwargs={'pk': session.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['content'], 'Hello')


class ChatArchiveTests(APITestCase):
    """Tests for archive functionality."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='archiveuser',
            email='archiveuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'archiveuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_archive_session(self):
        session = ChatSession.objects.create(user=self.user, title='Archive Test')
        url = reverse('ai_chatbot:session-archive', kwargs={'pk': session.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_archived'])

    def test_unarchive_session(self):
        session = ChatSession.objects.create(user=self.user, title='Archive Test', is_archived=True)
        url = reverse('ai_chatbot:session-archive', kwargs={'pk': session.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_archived'])

    def test_filter_archived_sessions(self):
        ChatSession.objects.create(user=self.user, title='Active', is_archived=False)
        ChatSession.objects.create(user=self.user, title='Archived', is_archived=True)
        url = reverse('ai_chatbot:session-list') + '?archived=true'
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Archived')


class ChatMessageTests(APITestCase):
    """Tests for the message send action."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='msguser',
            email='msguser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'msguser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
        self.session = ChatSession.objects.create(user=self.user, title='Test Session')

    @patch('services.ai_chat.chat_service.ChatService.send_message')
    def test_send_message_action(self, mock_send):
        mock_send.return_value = {
            'id': 1,
            'sender': 'AI',
            'content': 'Hello! How can I help?',
            'tool_calls': [],
            'created_at': timezone.now().isoformat(),
        }
        url = reverse('ai_chatbot:session-message', kwargs={'pk': self.session.id})
        response = self.client.post(url, {'message': 'Hello'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Hello! How can I help?')
        mock_send.assert_called_once()

    def test_send_empty_message_rejected(self):
        url = reverse('ai_chatbot:session-message', kwargs={'pk': self.session.id})
        response = self.client.post(url, {'message': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ChatSearchTests(APITestCase):
    """Tests for the search action."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='searchuser',
            email='searchuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'searchuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_search_conversations(self):
        session = ChatSession.objects.create(user=self.user, title='Coding')
        ChatMessage.objects.create(session=session, sender='USER', content='How to implement binary search?')
        ChatMessage.objects.create(session=session, sender='AI', content='Binary search works by dividing...')

        url = reverse('ai_chatbot:session-search') + '?q=binary'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

    def test_search_empty_query(self):
        url = reverse('ai_chatbot:session-search') + '?q='
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenUsageTests(APITestCase):
    """Tests for the token usage endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='tokenuser',
            email='tokenuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'tokenuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_token_usage_endpoint(self):
        url = reverse('ai_chatbot:session-token-usage')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('chat', response.data)


class ToolRouterTests(APITestCase):
    """Tests for the tool router detection logic."""

    def test_detects_task_keywords(self):
        from services.ai_chat.tool_router import detect_tools_needed
        tools = detect_tools_needed("Show me my overdue tasks")
        self.assertIn('get_tasks', tools)

    def test_detects_goal_keywords(self):
        from services.ai_chat.tool_router import detect_tools_needed
        tools = detect_tools_needed("What are my goals?")
        self.assertIn('get_goals', tools)

    def test_detects_habit_keywords(self):
        from services.ai_chat.tool_router import detect_tools_needed
        tools = detect_tools_needed("Show my habit streaks")
        self.assertIn('get_habits', tools)

    def test_detects_productivity_keywords(self):
        from services.ai_chat.tool_router import detect_tools_needed
        tools = detect_tools_needed("What's my productivity score?")
        self.assertIn('get_productivity', tools)

    def test_no_tools_for_general_question(self):
        from services.ai_chat.tool_router import detect_tools_needed
        tools = detect_tools_needed("Explain binary search in Python")
        self.assertEqual(tools, [])

    def test_broad_query_triggers_multiple_tools(self):
        from services.ai_chat.tool_router import detect_tools_needed
        tools = detect_tools_needed("What should I do today")
        self.assertGreater(len(tools), 1)


class ContextBuilderTests(APITestCase):
    """Tests for the context builder."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ctxuser',
            email='ctxuser@example.com',
            password='SecurePassword123!'
        )

    def test_get_user_tasks_with_data(self):
        from services.ai_chat.context_builder import get_user_tasks
        Task.objects.create(
            user=self.user,
            title='Test Task',
            status='TODO',
            priority='HIGH',
            due_date=timezone.now() + timezone.timedelta(days=1),
        )
        result = get_user_tasks(self.user)
        self.assertIn('Test Task', result)
        self.assertIn('HIGH', result)

    def test_get_user_tasks_empty(self):
        from services.ai_chat.context_builder import get_user_tasks
        result = get_user_tasks(self.user)
        self.assertIn('No active tasks', result)

    def test_get_user_goals_with_data(self):
        from services.ai_chat.context_builder import get_user_goals
        Goal.objects.create(
            user=self.user,
            title='Learn Django',
            target_date=timezone.now().date(),
        )
        result = get_user_goals(self.user)
        self.assertIn('Learn Django', result)


class MemoryTests(APITestCase):
    """Tests for conversation memory management."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='memuser',
            email='memuser@example.com',
            password='SecurePassword123!'
        )
        self.session = ChatSession.objects.create(user=self.user, title='Memory Test')

    def test_short_term_memory(self):
        from services.ai_chat.memory import get_short_term_memory
        ChatMessage.objects.create(session=self.session, sender='USER', content='Hello')
        ChatMessage.objects.create(session=self.session, sender='AI', content='Hi!')
        memory_list = get_short_term_memory(self.session.id)
        self.assertEqual(len(memory_list), 2)
        self.assertEqual(memory_list[0]['content'], 'Hello')

    def test_long_term_memory(self):
        from services.ai_chat.memory import get_long_term_memory
        self.session.summary = "Previous context about coding."
        self.session.save()
        summary = get_long_term_memory(self.session.id)
        self.assertEqual(summary, "Previous context about coding.")

    def test_summarization_not_triggered_below_threshold(self):
        from services.ai_chat.memory import compress_and_summarize
        # Create fewer than threshold messages
        for i in range(5):
            ChatMessage.objects.create(session=self.session, sender='USER', content=f'Message {i}')
        compress_and_summarize(self.session.id)
        # All messages should still exist
        self.assertEqual(self.session.messages.count(), 5)


class AuthenticationTests(APITestCase):
    """Tests for unauthenticated access rejection."""

    def test_unauthenticated_list_sessions(self):
        url = reverse('ai_chatbot:session-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_search(self):
        url = reverse('ai_chatbot:session-search') + '?q=test'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suggested_prompts_endpoint(self):
        user = User.objects.create_user(
            username='suggestuser',
            email='suggestuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'suggestuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
        url = reverse('ai_chatbot:session-suggested-prompts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("suggested_prompts", response.data)
        self.assertGreater(len(response.data['suggested_prompts']), 0)
