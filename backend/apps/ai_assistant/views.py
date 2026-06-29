import json
from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.db.models import Sum
from drf_spectacular.utils import extend_schema

from .models import AITokenLog
from .serializers import (
    TaskBreakdownInputSerializer,
    PlannerInputSerializer,
    AIResponseSerializer,
    AICostAnalyticsSerializer
)
from services.ai.agents import (
    PlannerAgent,
    PriorityAgent,
    ProductivityCoach,
    ScheduleOptimizer,
    DeadlinePredictor,
    TaskBreakdownAgent,
    MotivationAgent,
    DailySummaryGenerator,
    WeeklySummaryGenerator
)

class AIPlannerView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(request=PlannerInputSerializer, responses={200: AIResponseSerializer})
    def post(self, request):
        serializer = PlannerInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tasks = serializer.validated_data['tasks']
        goals = serializer.validated_data['goals']

        agent = PlannerAgent()
        response_text = agent.generate_plan(request.user, "\n".join(tasks), "\n".join(goals))

        return Response({
            "response": response_text,
            "agent_name": "PlannerAgent"
        }, status=status.HTTP_200_OK)


class AIPriorityView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        tasks = request.data.get('tasks', [])
        if not tasks:
            return Response({"error": "No tasks provided."}, status=status.HTTP_400_BAD_REQUEST)

        agent = PriorityAgent()
        response_text = agent.analyze_priorities(request.user, "\n".join(tasks))

        return Response({
            "response": response_text,
            "agent_name": "PriorityAgent"
        }, status=status.HTTP_200_OK)


class AICoachView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        habits = request.data.get('habits', [])
        streaks = request.data.get('streaks', '')

        agent = ProductivityCoach()
        response_text = agent.get_coaching_advice(request.user, "\n".join(habits), streaks)

        return Response({
            "response": response_text,
            "agent_name": "ProductivityCoach"
        }, status=status.HTTP_200_OK)


class AIScheduleOptimizerView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        tasks = request.data.get('tasks', [])
        if not tasks:
            return Response({"error": "No tasks provided."}, status=status.HTTP_400_BAD_REQUEST)

        agent = ScheduleOptimizer()
        response_text = agent.optimize_schedule(request.user, "\n".join(tasks))

        return Response({
            "response": response_text,
            "agent_name": "ScheduleOptimizer"
        }, status=status.HTTP_200_OK)


class AIDeadlinePredictorView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        backlog_size = request.data.get('backlog_size', 0)
        upcoming_tasks = request.data.get('upcoming_tasks', [])

        agent = DeadlinePredictor()
        response_text = agent.predict_deadlines(request.user, backlog_size, "\n".join(upcoming_tasks))

        return Response({
            "response": response_text,
            "agent_name": "DeadlinePredictor"
        }, status=status.HTTP_200_OK)


class AITaskBreakdownView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(request=TaskBreakdownInputSerializer)
    def post(self, request):
        serializer = TaskBreakdownInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        title = serializer.validated_data['title']
        description = serializer.validated_data.get('description', '')

        agent = TaskBreakdownAgent()
        response_raw = agent.breakdown_task(request.user, title, description)

        try:
            # Parse response as JSON list of strings
            subtasks = json.loads(response_raw)
            if not isinstance(subtasks, list):
                raise ValueError()
        except Exception:
            # Fallback if LLM output was not clean JSON
            subtasks = [line.strip('- ').strip('123456789. ') for line in response_raw.split('\n') if line.strip()]

        return Response({
            "subtasks": subtasks,
            "agent_name": "TaskBreakdownAgent"
        }, status=status.HTTP_200_OK)


class AIMotivationView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        streaks = request.data.get('streaks', 0)
        completed_count = request.data.get('completed_count', 0)

        agent = MotivationAgent()
        response_text = agent.get_motivation(request.user, streaks, completed_count)

        return Response({
            "response": response_text,
            "agent_name": "MotivationAgent"
        }, status=status.HTTP_200_OK)


class AIDailySummaryView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        achievements = request.data.get('achievements', [])
        
        agent = DailySummaryGenerator()
        response_text = agent.generate_summary(request.user, "\n".join(achievements))

        return Response({
            "response": response_text,
            "agent_name": "DailySummaryGenerator"
        }, status=status.HTTP_200_OK)


class AIWeeklySummaryView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        stats = request.data.get('stats', '')

        agent = WeeklySummaryGenerator()
        response_text = agent.generate_weekly_report(request.user, stats)

        return Response({
            "response": response_text,
            "agent_name": "WeeklySummaryGenerator"
        }, status=status.HTTP_200_OK)


class AICostAnalyticsView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        """
        Returns total USD spending and itemized token logs.
        """
        logs = AITokenLog.objects.filter(user=request.user).order_by('-created_at')
        total_cost = logs.aggregate(total=Sum('cost'))['total'] or 0.0

        return Response({
            "total_cost": float(total_cost),
            "itemized_logs": AICostAnalyticsSerializer(logs, many=True).data
        }, status=status.HTTP_200_OK)
