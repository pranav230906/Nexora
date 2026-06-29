from rest_framework import serializers
from .models import DeletedRecord

class DeletedRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeletedRecord
        fields = ('model_name', 'object_id', 'deleted_at')
        read_only_fields = fields


class SyncQueueOperationSerializer(serializers.Serializer):
    ACTION_CHOICES = (
        ('CREATE', 'Create record'),
        ('UPDATE', 'Update record'),
        ('DELETE', 'Delete record')
    )
    MODEL_CHOICES = (
        ('Task', 'Task model'),
        ('Habit', 'Habit model'),
        ('Goal', 'Goal model')
    )

    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    model_name = serializers.ChoiceField(choices=MODEL_CHOICES)
    object_id = serializers.CharField(max_length=64)
    client_timestamp = serializers.DateTimeField()
    data = serializers.JSONField(required=False, default=dict)
