from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from services.ai.base import BaseAIAgent
from .models import AITokenLog

User = get_user_model()

class AIAssistantTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='aiuser',
            email='aiuser@example.com',
            password='SecurePassword123!'
        )
        url = reverse('auth:login')
        response = self.client.post(url, {
            'email': 'aiuser@example.com',
            'password': 'SecurePassword123!'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_cost_calculation(self):
        agent = BaseAIAgent(system_prompt="Test")
        cost = agent.calculate_cost(1000, 2000)
        self.assertAlmostEqual(cost, 0.00135)

    def test_token_logging(self):
        agent = BaseAIAgent(system_prompt="Test")
        agent.log_token_usage(self.user, "TestAgent", 100, 200)
        
        log = AITokenLog.objects.filter(user=self.user).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.agent_name, "TestAgent")
        self.assertEqual(log.input_tokens, 100)
        self.assertEqual(log.output_tokens, 200)
        self.assertGreater(log.cost, 0)

    def test_planner_agent_view(self):
        url = reverse('ai_assistant:planner')
        data = {
            "tasks": ["Implement OAuth", "Fix settings warnings"],
            "goals": ["Acquire 10 users"]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "PlannerAgent")

    def test_priority_agent_view(self):
        url = reverse('ai_assistant:priority')
        data = {"tasks": ["Fix critical login bug", "Update about page text"]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "PriorityAgent")

    def test_coach_agent_view(self):
        url = reverse('ai_assistant:coach')
        data = {
            "habits": ["Drink water", "Read docs"],
            "streaks": "Water: 5 days"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "ProductivityCoach")

    def test_optimize_agent_view(self):
        url = reverse('ai_assistant:optimize')
        data = {"tasks": ["Coding morning", "Client call afternoon"]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "ScheduleOptimizer")

    def test_deadline_agent_view(self):
        url = reverse('ai_assistant:deadline')
        data = {
            "backlog_size": 15,
            "upcoming_tasks": ["Finalize build", "QA test"]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "DeadlinePredictor")

    def test_task_breakdown_agent_view(self):
        url = reverse('ai_assistant:breakdown')
        data = {
            "title": "Build a Django Web Application",
            "description": "Must have models, serializers, and views."
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("subtasks", response.data)
        self.assertGreater(len(response.data["subtasks"]), 0)

    def test_motivation_agent_view(self):
        url = reverse('ai_assistant:motivation')
        data = {
            "streaks": 12,
            "completed_count": 35
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "MotivationAgent")

    def test_daily_summary_agent_view(self):
        url = reverse('ai_assistant:daily-summary')
        data = {"achievements": ["Completed tasks migrations", "Connected swagger docs"]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "DailySummaryGenerator")

    def test_weekly_summary_agent_view(self):
        url = reverse('ai_assistant:weekly-summary')
        data = {"stats": "Completed 15 tasks, 8 habits checked off"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["agent_name"], "WeeklySummaryGenerator")

    def test_cost_analytics_endpoint(self):
        AITokenLog.objects.create(user=self.user, agent_name="AgentA", input_tokens=100, output_tokens=200, cost=0.05)
        AITokenLog.objects.create(user=self.user, agent_name="AgentB", input_tokens=200, output_tokens=400, cost=0.10)
        
        url = reverse('ai_assistant:cost-analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_cost'], 0.15)
        self.assertEqual(len(response.data['itemized_logs']), 2)
