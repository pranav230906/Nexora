from rest_framework import serializers
from .models import Goal, Milestone, Habit, HabitLog

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ('id', 'title', 'is_completed')
        read_only_fields = ('id',)


class GoalSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, required=False)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = ('id', 'title', 'description', 'target_date', 'is_completed', 'milestones', 'progress', 'created_at')
        read_only_fields = ('id', 'progress', 'created_at')

    def get_progress(self, obj):
        total = obj.milestones.count()
        if total > 0:
            completed = obj.milestones.filter(is_completed=True).count()
            return int((completed / total) * 100)
        return 100 if obj.is_completed else 0

    def create(self, validated_data):
        user = self.context['request'].user
        milestones_data = validated_data.pop('milestones', [])
        
        goal = Goal.objects.create(user=user, **validated_data)
        
        for milestone in milestones_data:
            Milestone.objects.create(goal=goal, **milestone)
            
        return goal

    def update(self, instance, validated_data):
        milestones_data = validated_data.pop('milestones', None)
        instance = super().update(instance, validated_data)

        if milestones_data is not None:
            instance.milestones.all().delete()
            for milestone in milestones_data:
                Milestone.objects.create(goal=instance, **milestone)

        return instance


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ('id', 'date', 'is_completed')
        read_only_fields = ('id',)


class HabitSerializer(serializers.ModelSerializer):
    logs = HabitLogSerializer(many=True, read_only=True)
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = ('id', 'name', 'description', 'frequency', 'streak', 'max_streak', 'completion_rate', 'logs', 'created_at')
        read_only_fields = ('id', 'streak', 'max_streak', 'completion_rate', 'created_at')

    def get_completion_rate(self, obj):
        """
        Calculates completion rate over the last 30 days.
        """
        import datetime
        from django.utils import timezone
        today = timezone.now().date()
        thirty_days_ago = today - datetime.timedelta(days=30)
        
        total_logs = obj.logs.filter(date__gte=thirty_days_ago).count()
        if total_logs > 0:
            completed = obj.logs.filter(date__gte=thirty_days_ago, is_completed=True).count()
            return int((completed / total_logs) * 100)
        return 0

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
