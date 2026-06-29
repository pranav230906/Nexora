from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer
from apps.tasks.models import Task
from apps.goals_habits.models import Habit

class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Retrieves the complete message history for this chat session.
        """
        session = self.get_object()
        messages = session.messages.all().order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def suggested_prompts(self, request):
        """
        Generates context-aware suggested prompts based on the user's active tasks and habits.
        """
        user = request.user
        
        # Get active tasks and habits count to build prompts
        active_tasks = Task.active_objects.filter(user=user, status__in=['TODO', 'IN_PROGRESS']).order_by('priority')[:2]
        habits = Habit.objects.filter(user=user).order_by('-streak')[:2]

        prompts = [
            "How can I optimize my energy levels today?",
            "Give me a motivation booster quote."
        ]

        if active_tasks.exists():
            task_titles = [t.title for t in active_tasks]
            prompts.append(f"How should I tackle '{task_titles[0]}' first?")
            if len(task_titles) > 1:
                prompts.append(f"Can you help me break down '{task_titles[1]}' into checklist items?")

        if habits.exists():
            habit_names = [h.name for h in habits]
            prompts.append(f"Help me maintain my streak for '{habit_names[0]}'.")

        return Response({
            "suggested_prompts": prompts[:4] # Return max 4 items
        }, status=status.HTTP_200_OK)
