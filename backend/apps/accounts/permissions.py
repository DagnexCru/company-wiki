from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to authenticated users who possess the Administrator role
    or superuser status.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_admin or request.user.is_superuser)
        )


class IsAuthorUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with AUTHOR or ADMIN roles.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_author
        )


class IsReviewerUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with REVIEWER or ADMIN roles.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_reviewer
        )


class IsReaderUser(permissions.BasePermission):
    """
    Allows access to any authenticated reader, reviewer, author, or administrator.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Object-level permission allowing users to manage their own profile,
    or administrators to manage any profile.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.is_admin or obj == request.user)
