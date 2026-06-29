from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GamificationProfileView,
    LeaderboardView,
    AchievementViewSet,
    ChallengeViewSet
)

router = DefaultRouter()
router.register('achievements', AchievementViewSet, basename='achievements')
router.register('challenges', ChallengeViewSet, basename='challenges')

app_name = 'gamification'

urlpatterns = [
    path('profile/', GamificationProfileView.as_view(), name='profile'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('', include(router.urls)),
]
