from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission class verifying that modifying actions are only performed by the resource owner.
    """
    def has_object_permission(self, request, view, obj):
        # Safe methods are allowed to any request (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the resource
        return getattr(obj, 'user', None) == request.user
