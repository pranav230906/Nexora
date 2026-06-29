from rest_framework import serializers
from .models import UserGamificationProfile, Achievement, UserAchievement, Challenge, UserChallengeProgress

class UserGamificationProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserGamificationProfile
        fields = ('id', 'email', 'username', 'xp', 'coins', 'level', 'streak_days', 'last_active_date')
        read_only_fields = ('id', 'xp', 'coins', 'level', 'streak_days', 'last_active_date')


class AchievementSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    unlocked_at = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ('id', 'title', 'description', 'icon_name', 'xp_reward', 'coins_reward', 'criteria_type', 'target_value', 'is_unlocked', 'unlocked_at')

    def get_is_unlocked(self, obj):
        user = self.context['request'].user
        if user.is_anonymous:
            return False
        return UserAchievement.objects.filter(user=user, achievement=obj).exists()

    def get_unlocked_at(self, obj):
        user = self.context['request'].user
        if user.is_anonymous:
            return None
        record = UserAchievement.objects.filter(user=user, achievement=obj).first()
        return record.unlocked_at if record else None


class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ('id', 'title', 'description', 'type', 'criteria_type', 'target_value', 'xp_reward', 'coins_reward', 'start_date', 'end_date')


class UserChallengeProgressSerializer(serializers.ModelSerializer):
    challenge = ChallengeSerializer(read_only=True)

    class Meta:
        model = UserChallengeProgress
        fields = ('id', 'challenge', 'current_value', 'is_completed', 'completed_at')
        read_only_fields = ('id', 'current_value', 'is_completed', 'completed_at')
