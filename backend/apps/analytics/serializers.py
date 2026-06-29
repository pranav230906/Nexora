from rest_framework import serializers
from .models import UserProductivityReport, DailyFocusLog

class UserProductivityReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProductivityReport
        fields = (
            'id', 'report_type', 'start_date', 'end_date', 'productivity_score',
            'tasks_completed', 'tasks_created', 'habit_consistency', 'focus_hours',
            'ai_insights', 'created_at'
        )
        read_only_fields = fields


class DailyFocusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyFocusLog
        fields = ('id', 'date', 'focus_minutes', 'completed_tasks_count')
        read_only_fields = fields
