import os
import tempfile
from rest_framework import views, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.tasks.models import Task
from services.ai_action_engine.action_engine import ActionEngine
from services.ai_action_engine import progress_tracker, accountability_service
from .serializers import InputProcessSerializer, VoiceUploadSerializer, TaskVerifySerializer


class ActionEngineThrottle(UserRateThrottle):
    rate = '20/minute'


class ProcessInputView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = [ActionEngineThrottle]

    @extend_schema(
        request=InputProcessSerializer,
        description="Processes raw text command entries to detect intent and parse tasks/scheduling."
    )
    def post(self, request):
        serializer = InputProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text = serializer.validated_data.get('text', '')

        result = ActionEngine.process_raw_input(request.user, text=text)
        if result.get("success"):
            return Response(result, status=status.HTTP_200_OK)
        return Response({"error": result.get("error", "Failed to process input.")}, status=status.HTTP_400_BAD_REQUEST)


class VoiceUploadView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = [ActionEngineThrottle]

    @extend_schema(
        request=VoiceUploadSerializer,
        description="Accepts uploaded audio voice file, transcribes it, and routes to action pipeline."
    )
    def post(self, request):
        serializer = VoiceUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        audio = serializer.validated_data['audio_file']

        # Save to temp file for Whisper transcribing
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.name)[1]) as temp_file:
            for chunk in audio.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        try:
            result = ActionEngine.process_raw_input(request.user, audio_file_path=temp_path)
            if result.get("success"):
                return Response(result, status=status.HTTP_200_OK)
            return Response({"error": result.get("error", "Audio transcription failed.")}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)


class VerifyTaskView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = [ActionEngineThrottle]

    @extend_schema(
        request=TaskVerifySerializer,
        description="Submits validation summaries or details to complete a task via AI verification."
    )
    def post(self, request):
        serializer = TaskVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task_id = serializer.validated_data['task_id']
        sub_text = serializer.validated_data.get('submission_text')
        file_desc = serializer.validated_data.get('file_description')

        try:
            task = Task.active_objects.get(id=task_id, user=request.user)
        except Task.DoesNotExist:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        from services.ai_action_engine.completion_verifier import verify_task_completion
        result = verify_task_completion(task, submission_text=sub_text, file_description=file_desc)
        return Response(result, status=status.HTTP_200_OK)


class AccountabilityView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        parameters=[
            OpenApiParameter(name='phase', type=str, default='MIDDAY_CHECKIN', description='Coaching alert type')
        ],
        description="Retrieves a customized motivational check-in or planning summary from the AI Accountability Partner."
    )
    def get(self, request):
        phase = request.query_params.get('phase', 'MIDDAY_CHECKIN')
        result = accountability_service.generate_accountability_message(request.user, phase)
        return Response(result, status=status.HTTP_200_OK)


class RemindersListView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        """
        Retrieves in-app notification summaries sent to the user.
        """
        from apps.notifications.models import NotificationLog
        logs = NotificationLog.objects.filter(user=request.user, title__icontains="AI Action").order_by('-created_at')[:20]
        data = [{
            "id": log.id,
            "title": log.title,
            "message": log.message,
            "created_at": log.created_at.isoformat()
        } for log in logs]
        return Response(data, status=status.HTTP_200_OK)


class ProgressAnalyticsView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        """
        Returns high-level daily progress statistics.
        """
        summary = progress_tracker.get_user_progress_summary(request.user)
        return Response(summary, status=status.HTTP_200_OK)


class ReplanDayView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        """
        Force-compiles a newly optimized conflict-free daily timeblock plan.
        """
        from services.ai_action_engine.planner import generate_daily_schedule
        blocks = generate_daily_schedule(request.user)
        return Response({
            "success": True,
            "schedule": blocks
        }, status=status.HTTP_200_OK)
