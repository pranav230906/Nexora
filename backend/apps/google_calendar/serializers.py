from rest_framework import serializers

class OAuthCallbackSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    redirect_uri = serializers.CharField(required=False)


class ConflictCheckSerializer(serializers.Serializer):
    start_time = serializers.DateTimeField(required=True)
    end_time = serializers.DateTimeField(required=True)
