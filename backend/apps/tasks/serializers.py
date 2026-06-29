from rest_framework import serializers
from .models import Tag, Task, ChecklistItem, Comment, Attachment

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'color')
        read_only_fields = ('id',)

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ('id', 'title', 'is_completed')
        read_only_fields = ('id',)


class CommentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'user_email', 'content', 'created_at')
        read_only_fields = ('id', 'created_at', 'user_email')


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ('id', 'file', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class SubTaskSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'status', 'priority', 'due_date', 'progress')


class TaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), write_only=True, many=True, source='tags', required=False
    )
    
    checklist_items = ChecklistItemSerializer(many=True, required=False)
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    subtasks = SubTaskSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority',
            'tags', 'tag_ids', 'due_date', 'estimated_time', 'actual_time',
            'parent', 'is_recurring', 'recurrence_pattern', 'progress',
            'checklist_items', 'comments', 'attachments', 'subtasks', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'progress', 'created_at', 'updated_at')

    def create(self, validated_data):
        user = self.context['request'].user
        checklist_data = validated_data.pop('checklist_items', [])
        tags = validated_data.pop('tags', [])
        
        task = Task.objects.create(user=user, **validated_data)
        
        # Save tags links
        if tags:
            task.tags.set(tags)
            
        # Create checklist items
        for item in checklist_data:
            ChecklistItem.objects.create(task=task, **item)
            
        return task

    def update(self, instance, validated_data):
        checklist_data = validated_data.pop('checklist_items', None)
        tags = validated_data.pop('tags', None)

        instance = super().update(instance, validated_data)

        if tags is not None:
            instance.tags.set(tags)

        if checklist_data is not None:
            # Simple sync: delete old and recreate
            instance.checklist_items.all().delete()
            for item in checklist_data:
                ChecklistItem.objects.create(task=instance, **item)

        return instance
