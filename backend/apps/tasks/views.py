from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Tag, Task, Comment, Attachment
from .serializers import (
    TagSerializer,
    TaskSerializer,
    CommentSerializer,
    AttachmentSerializer
)

class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at', 'progress']
    ordering = ['due_date']

    def get_queryset(self):
        user = self.request.user
        # Optimize queries (Select / Prefetch related to avoid N+1 issues)
        queryset = Task.objects.filter(user=user).select_related('parent').prefetch_related(
            'tags', 'checklist_items', 'comments', 'attachments', 'subtasks'
        )

        # Filters mapping
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        tag_filter = self.request.query_params.get('tag')
        
        # Soft delete vs active vs archive
        view_mode = self.request.query_params.get('view_mode', 'active') # 'active', 'archived', 'trash', 'all'

        if view_mode == 'archived':
            queryset = queryset.filter(status=Task.Status.ARCHIVED, deleted_at__isnull=True)
        elif view_mode == 'trash':
            queryset = queryset.filter(status=Task.Status.TRASH, deleted_at__isnull=False)
        elif view_mode == 'active':
            queryset = queryset.filter(deleted_at__isnull=True).exclude(status=Task.Status.ARCHIVED)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if tag_filter:
            queryset = queryset.filter(tags__id=tag_filter)

        return queryset

    @extend_schema(request=None)
    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        task = self.get_object()
        task.soft_delete()
        return Response({"message": "Task soft-deleted (moved to Trash)."}, status=status.HTTP_200_OK)

    @extend_schema(request=None)
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        task = self.get_object()
        task.restore()
        return Response({"message": "Task restored from Trash."}, status=status.HTTP_200_OK)

    @extend_schema(request=None)
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        task = self.get_object()
        task.status = Task.Status.ARCHIVED
        task.save()
        return Response({"message": "Task archived successfully."}, status=status.HTTP_200_OK)

    # Bulk Operations
    @action(detail=False, methods=['post'])
    def bulk_status(self, request):
        task_ids = request.data.get('task_ids', [])
        new_status = request.data.get('status')
        if not task_ids or not new_status:
            return Response({"error": "Missing task_ids or status parameters."}, status=status.HTTP_400_BAD_REQUEST)
        
        Task.objects.filter(user=request.user, id__in=task_ids).update(status=new_status)
        return Response({"message": f"Successfully updated status for {len(task_ids)} tasks."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_archive(self, request):
        task_ids = request.data.get('task_ids', [])
        if not task_ids:
            return Response({"error": "Missing task_ids parameter."}, status=status.HTTP_400_BAD_REQUEST)

        Task.objects.filter(user=request.user, id__in=task_ids).update(status=Task.Status.ARCHIVED)
        return Response({"message": f"Successfully archived {len(task_ids)} tasks."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        task_ids = request.data.get('task_ids', [])
        if not task_ids:
            return Response({"error": "Missing task_ids parameter."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        Task.objects.filter(user=request.user, id__in=task_ids).update(deleted_at=now, status=Task.Status.TRASH)
        return Response({"message": f"Successfully soft-deleted {len(task_ids)} tasks."}, status=status.HTTP_200_OK)

    # Comments and Attachments additions
    @extend_schema(request=CommentSerializer, responses=CommentSerializer)
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        task = self.get_object()
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(request=AttachmentSerializer, responses=AttachmentSerializer)
    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        task = self.get_object()
        serializer = AttachmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
