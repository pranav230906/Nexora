from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagViewSet, TaskViewSet

router = DefaultRouter()
router.register('tags', TagViewSet, basename='tag')
router.register('tasks', TaskViewSet, basename='task')

app_name = 'tasks'

urlpatterns = [
    path('', include(router.urls)),
]
