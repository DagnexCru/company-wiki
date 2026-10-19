from rest_framework import permissions


class CanCreateArticle(permissions.BasePermission):
    """
    Allow creation only to authenticated users with AUTHOR or ADMIN roles.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_author or request.user.is_admin


class IsAuthorOrAdmin(permissions.BasePermission):
    """
    Object-level permission allowing only the article's author or an Administrator
    to edit or delete it.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_author or request.user.is_admin

    def has_object_permission(self, request, view, obj):
        # Read permissions are handled by queryset filtering
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # Admin can manage any article
        if request.user.is_admin:
            return True

        # Authors can only modify their own articles
        return obj.author == request.user

# Permission Check: CanCreateArticle verifies is_author or is_admin flag on user model.

# Object Permission: IsAuthorOrAdmin restricts mutating actions to the record creator.
