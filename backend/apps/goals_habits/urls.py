from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, HabitViewSet

router = DefaultRouter()
router.register('goals', GoalViewSet, basename='goal')
router.register('habits', HabitViewSet, basename='habit')

app_name = 'goals_habits'

urlpatterns = [
    path('', include(router.urls)),
]
