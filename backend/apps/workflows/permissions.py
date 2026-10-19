from rest_framework import permissions


class IsReviewerOrAdmin(permissions.BasePermission):
    """
    Permission granting access strictly to authenticated Reviewers and Administrators.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin or getattr(request.user, "role", None) in ["REVIEWER", "ADMIN"]


class CanReviewArticle(permissions.BasePermission):
    """
    Object-level permission ensuring:
    - User is a Reviewer or Admin.
    - Independent review invariant: Authors cannot approve or reject their own article unless Admin.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_admin:
            return True

        # Non-admin reviewers cannot review their own articles
        if getattr(user, "role", None) == "REVIEWER":
            return obj.author != user

        return False
