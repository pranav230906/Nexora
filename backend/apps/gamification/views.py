from rest_framework import views, viewsets, permissions, generics, status
from rest_framework.response import Response
from django.db.models import F
from django.contrib.auth import get_user_model

from .models import UserGamificationProfile, Achievement, Challenge, UserChallengeProgress
from .serializers import (
    UserGamificationProfileSerializer,
    AchievementSerializer,
    ChallengeSerializer,
    UserChallengeProgressSerializer
)

User = get_user_model()

class GamificationProfileView(generics.RetrieveAPIView):
    serializer_class = UserGamificationProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        profile, created = UserGamificationProfile.objects.get_or_create(user=self.request.user)
        return profile


class LeaderboardView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # Fetch profiles sorted by XP descending
        profiles = UserGamificationProfile.objects.select_related('user').order_by('-xp')[:50]
        
        leaderboard_data = []
        for index, p in enumerate(profiles):
            leaderboard_data.append({
                'rank': index + 1,
                'email': p.user.email,
                'username': p.user.username or p.user.email.split('@')[0],
                'xp': p.xp,
                'level': p.level,
                'streak_days': p.streak_days
            })
            
        return Response(leaderboard_data, status=status.HTTP_200_OK)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Return all active challenges
        return Challenge.objects.filter(
            start_date__lte=self.request.user.date_joined or F('start_date')
        ).order_by('-start_date')

    def list(self, request, *args, **kwargs):
        # Return active challenges annotated with user's progress
        challenges = self.get_queryset()
        data = []
        for ch in challenges:
            progress, created = UserChallengeProgress.objects.get_or_create(
                user=request.user,
                challenge=ch
            )
            data.append({
                'id': ch.id,
                'title': ch.title,
                'description': ch.description,
                'type': ch.type,
                'criteria_type': ch.criteria_type,
                'target_value': ch.target_value,
                'xp_reward': ch.xp_reward,
                'coins_reward': ch.coins_reward,
                'end_date': ch.end_date,
                'current_value': progress.current_value,
                'is_completed': progress.is_completed,
                'completed_at': progress.completed_at
            })
        return Response(data, status=status.HTTP_200_OK)
