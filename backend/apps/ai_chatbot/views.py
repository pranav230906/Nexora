from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionSerializer,
    ChatMessageSerializer,
    ChatMessageInputSerializer,
    ChatSearchSerializer,
)
from apps.tasks.models import Task
from apps.goals_habits.models import Habit
from services.ai_chat.chat_service import ChatService
from services.ai_chat.token_usage import get_user_usage_summary
from services.ai_chat.streaming import sse_stream_response


class ChatMessageThrottle(UserRateThrottle):
    """Rate limit: 30 messages per minute per user."""
    rate = '30/minute'


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')
        # Optionally filter archived sessions
        archived = self.request.query_params.get('archived')
        if archived == 'true':
            qs = qs.filter(is_archived=True)
        elif archived == 'false':
            qs = qs.filter(is_archived=False)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        responses={200: ChatMessageSerializer(many=True)},
        description="Retrieves the complete message history for this chat session.",
    )
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Retrieves the complete message history for this chat session.
        """
        session = self.get_object()
        messages = session.messages.all().order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=ChatMessageInputSerializer,
        responses={200: ChatMessageSerializer},
        description="Send a message to the AI assistant and receive a non-streaming response.",
    )
    @action(detail=True, methods=['post'], throttle_classes=[ChatMessageThrottle])
    def message(self, request, pk=None):
        """
        Send a message to the AI assistant (non-streaming).
        Returns the complete AI response.
        """
        session = self.get_object()
        serializer = ChatMessageInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data['message']

        try:
            service = ChatService()
            result = service.send_message(request.user, session.id, user_message)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Failed to process message: {str(e)[:200]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        request=ChatMessageInputSerializer,
        description="Send a message and receive a Server-Sent Events (SSE) streaming response.",
    )
    @action(detail=True, methods=['post'], throttle_classes=[ChatMessageThrottle])
    def stream(self, request, pk=None):
        """
        Send a message to the AI assistant (SSE streaming).
        Returns a text/event-stream response with real-time chunks.
        """
        session = self.get_object()
        serializer = ChatMessageInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data['message']

        try:
            service = ChatService()
            event_generator = service.stream_message(request.user, session.id, user_message)
            return sse_stream_response(event_generator)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Failed to process message: {str(e)[:200]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        description="Toggle archive status for a chat session.",
    )
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Toggle archive status for a chat session.
        """
        session = self.get_object()
        session.is_archived = not session.is_archived
        session.save(update_fields=['is_archived'])
        return Response(
            {'is_archived': session.is_archived, 'message': 'Session archived.' if session.is_archived else 'Session unarchived.'},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(name='q', type=str, required=True, description='Search query string'),
        ],
        description="Search across all chat conversations for the authenticated user.",
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Full-text search across all chat messages for the authenticated user.
        Also performs semantic search if vector store is available.
        """
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'error': 'Search query parameter "q" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Full-text search in database
        messages = ChatMessage.objects.filter(
            session__user=request.user,
            content__icontains=query,
        ).select_related('session').order_by('-created_at')[:20]

        results = []
        for msg in messages:
            results.append({
                'session_id': msg.session.id,
                'session_title': msg.session.title,
                'sender': msg.sender,
                'content': msg.content[:200],
                'created_at': msg.created_at.isoformat(),
            })

        # Semantic search (supplementary)
        semantic_results = []
        try:
            from services.ai_chat.vector_store import get_user_store
            store = get_user_store(request.user.id)
            semantic_hits = store.search(query, top_k=5)
            for hit in semantic_hits:
                semantic_results.append({
                    'text': hit.get('text', ''),
                    'session_id': hit.get('session_id'),
                    'score': hit.get('score', 0),
                })
        except Exception:
            pass  # Semantic search is best-effort

        return Response({
            'query': query,
            'results': results,
            'semantic_results': semantic_results,
        }, status=status.HTTP_200_OK)

    @extend_schema(
        description="Returns aggregated token usage statistics for the authenticated user.",
    )
    @action(detail=False, methods=['get'])
    def token_usage(self, request):
        """
        Returns aggregated AI token usage and cost statistics.
        """
        summary = get_user_usage_summary(request.user)
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def suggested_prompts(self, request):
        """
        Generates context-aware suggested prompts based on the user's active tasks and habits.
        """
        user = request.user

        # Get active tasks and habits count to build prompts
        active_tasks = Task.active_objects.filter(user=user, status__in=['TODO', 'IN_PROGRESS']).order_by('priority')[:2]
        habits = Habit.objects.filter(user=user).order_by('-streak')[:2]

        prompts_list = [
            "How can I optimize my energy levels today?",
            "Give me a motivation booster quote."
        ]

        if active_tasks.exists():
            task_titles = [t.title for t in active_tasks]
            prompts_list.append(f"How should I tackle '{task_titles[0]}' first?")
            if len(task_titles) > 1:
                prompts_list.append(f"Can you help me break down '{task_titles[1]}' into checklist items?")

        if habits.exists():
            habit_names = [h.name for h in habits]
            prompts_list.append(f"Help me maintain my streak for '{habit_names[0]}'.")

        return Response({
            "suggested_prompts": prompts_list[:4]  # Return max 4 items
        }, status=status.HTTP_200_OK)
