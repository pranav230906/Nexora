from rest_framework import serializers
from .models import AITokenLog

class TaskBreakdownInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')


class PlannerInputSerializer(serializers.Serializer):
    tasks = serializers.ListField(child=serializers.CharField(), required=True)
    goals = serializers.ListField(child=serializers.CharField(), required=False, default=[])


class AIResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    agent_name = serializers.CharField()


class AICostAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AITokenLog
        fields = ('id', 'agent_name', 'input_tokens', 'output_tokens', 'cost', 'created_at')
