from rest_framework import permissions


class IsAdminUserOnly(permissions.BasePermission):
    """
    Strict permission class ensuring only users with the ADMIN role
    can view or query the system audit trail.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_admin or getattr(request.user, "role", "") == "ADMIN")
        )
