from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('id', 'sender', 'content', 'tool_calls', 'token_count', 'created_at')
        read_only_fields = ('id', 'created_at')


class ChatSessionSerializer(serializers.ModelSerializer):
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = ChatSession
        fields = ('id', 'title', 'summary', 'is_archived', 'messages_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'summary', 'created_at', 'updated_at')


class ChatMessageInputSerializer(serializers.Serializer):
    """Validates incoming chat message submissions."""
    message = serializers.CharField(max_length=4000, required=True, help_text="The user's chat message.")


class ChatSearchSerializer(serializers.Serializer):
    """Validates search query parameters."""
    q = serializers.CharField(max_length=500, required=True, help_text="Search query string.")
