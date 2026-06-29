import logging
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from dateutil import parser as date_parser

from .models import DeletedRecord, SyncLog
from .serializers import SyncQueueOperationSerializer, DeletedRecordSerializer
from apps.tasks.models import Task
from apps.tasks.serializers import TaskSerializer
from apps.goals_habits.models import Habit, Goal
from apps.goals_habits.serializers import HabitSerializer, GoalSerializer

logger = logging.getLogger(__name__)

class SynchronizationAPIView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        device_id = request.data.get('device_id', 'generic-device')
        last_sync_time_str = request.data.get('last_sync_time')
        queue_data = request.data.get('queue', [])

        current_sync_time = timezone.now()

        # Parse last sync time (default to epoch if not provided)
        if last_sync_time_str:
            try:
                last_sync_time = date_parser.parse(last_sync_time_str)
            except Exception:
                last_sync_time = timezone.make_aware(timezone.datetime.min)
        else:
            last_sync_time = timezone.make_aware(timezone.datetime.min)

        # 1. Process Batch Sync Queue (Upload)
        operations_applied = 0
        for op_data in queue_data:
            serializer = SyncQueueOperationSerializer(data=op_data)
            if not serializer.is_valid():
                logger.warning(f"Skipped invalid sync queue operation: {serializer.errors}")
                continue

            op = serializer.validated_data
            action = op['action']
            model_name = op['model_name']
            object_id = op['object_id']
            client_timestamp = op['client_timestamp']
            payload = op.get('data', {})

            # Map Model and Serializer classes
            if model_name == 'Task':
                model_class = Task
                serializer_class = TaskSerializer
            elif model_name == 'Habit':
                model_class = Habit
                serializer_class = HabitSerializer
            elif model_name == 'Goal':
                model_class = Goal
                serializer_class = GoalSerializer
            else:
                continue

            # Process Actions
            if action == 'DELETE':
                # Hard-delete from database (post_delete signals log tombstone)
                try:
                    record = model_class.objects.filter(user=user, id=object_id).first()
                    if record:
                        record.delete()
                        operations_applied += 1
                except Exception as e:
                    logger.error(f"Failed to delete {model_name} {object_id}: {e}")

            elif action == 'CREATE':
                # Check if it already exists to prevent duplicate creation
                exists = model_class.objects.filter(user=user, id=object_id).exists()
                if not exists:
                    try:
                        # Include client ID in payload if database is UUID or writeable primary key
                        # To preserve database integrity, we override the ID if valid
                        payload['id'] = object_id
                        serialObj = serializer_class(data=payload, context={'request': request})
                        if serialObj.is_valid():
                            serialObj.save()
                            operations_applied += 1
                        else:
                            logger.warning(f"Validation failed for CREATE {model_name}: {serialObj.errors}")
                    except Exception as e:
                        logger.error(f"Failed to create {model_name}: {e}")

            elif action == 'UPDATE':
                # Find current record
                record = model_class.objects.filter(user=user, id=object_id).first()
                if record:
                    # Conflict Resolution: Last-Write-Wins
                    # Only apply client updates if the client timestamp is newer than server updated_at
                    # (Allowing a 1-second margin of error)
                    if client_timestamp > (record.updated_at + timezone.timedelta(seconds=1)):
                        try:
                            serialObj = serializer_class(
                                record, 
                                data=payload, 
                                partial=True, 
                                context={'request': request}
                            )
                            if serialObj.is_valid():
                                serialObj.save()
                                operations_applied += 1
                            else:
                                logger.warning(f"Validation failed for UPDATE {model_name}: {serialObj.errors}")
                        except Exception as e:
                            logger.error(f"Failed to update {model_name} {object_id}: {e}")
                    else:
                        logger.info(f"Conflict discarded (Server Wins) for {model_name} {object_id}")

        # 2. Compile Incremental Sync Delta (Download)
        # Fetch records modified/created since last sync time
        tasks = Task.objects.filter(user=user, updated_at__gt=last_sync_time)
        habits = Habit.objects.filter(user=user, updated_at__gt=last_sync_time)
        goals = Goal.objects.filter(user=user, updated_at__gt=last_sync_time)

        # Fetch deleted tombstones
        deletions = DeletedRecord.objects.filter(user=user, deleted_at__gt=last_sync_time)

        # Serialize results
        # Pass context containing request so nested absolute URLs are rendered if needed
        context = {'request': request}
        tasks_serial = TaskSerializer(tasks, many=True, context=context).data
        habits_serial = HabitSerializer(habits, many=True, context=context).data
        goals_serial = GoalSerializer(goals, many=True, context=context).data

        deletions_serial = DeletedRecordSerializer(deletions, many=True).data

        # 3. Log Sync timestamp
        sync_log, created = SyncLog.objects.get_or_create(user=user, device_id=device_id)
        sync_log.last_synced_at = current_sync_time
        sync_log.save()

        return Response({
            "sync_time": current_sync_time.isoformat(),
            "operations_applied": operations_applied,
            "upserted": {
                "tasks": tasks_serial,
                "habits": habits_serial,
                "goals": goals_serial
            },
            "deleted": deletions_serial
        }, status=status.HTTP_200_OK)
