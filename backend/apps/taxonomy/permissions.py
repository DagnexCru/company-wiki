from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission allowing all authenticated users to read taxonomy (categories and tags),
    while restricting creation, modification, and deletion strictly to Administrators.
    """

    def has_permission(self, request, view):
        # Unauthenticated users cannot read internal taxonomy
        if not request.user or not request.user.is_authenticated:
            return False

        # Read operations (GET, HEAD, OPTIONS) permitted for any authenticated employee
        if request.method in permissions.SAFE_METHODS:
            return True

        # Mutation operations strictly restricted to Administrators
        return request.user.is_admin

# Permission Policy: Authenticated readers have full read access; write access is restricted to Administrators.
