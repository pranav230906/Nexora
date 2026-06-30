from rest_framework import serializers


class InputProcessSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class VoiceUploadSerializer(serializers.Serializer):
    audio_file = serializers.FileField(required=True, help_text="Uploaded audio file (wav/mp3/m4a)")


class TaskVerifySerializer(serializers.Serializer):
    task_id = serializers.IntegerField(required=True)
    submission_text = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    file_description = serializers.CharField(required=False, allow_blank=True, max_length=1000)
