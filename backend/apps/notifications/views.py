from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and interacting with in-app notifications.
    Strictly scoped to the authenticated user's own notifications.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Notification.objects.filter(recipient=user)
            .select_related("sender", "article")
            .order_by("-created_at")
        )

        filter_param = self.request.query_params.get("filter")
        if filter_param == "unread":
            queryset = queryset.filter(is_read=False)

        is_read_param = self.request.query_params.get("is_read")
        if is_read_param is not None:
            if str(is_read_param).lower() in ["false", "0"]:
                queryset = queryset.filter(is_read=False)
            elif str(is_read_param).lower() in ["true", "1"]:
                queryset = queryset.filter(is_read=True)

        return queryset[:50]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response(
            {
                "count": len(serializer.data),
                "unread_count": unread_count,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        """
        Fast lightweight endpoint for notification bell badge count.
        GET /api/v1/notifications/unread-count/
        """
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="read")
    def mark_as_read(self, request, pk=None):
        """
        Mark an individual notification as read.
        POST /api/v1/notifications/{id}/read/
        """
        try:
            notif = Notification.objects.get(id=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found or access denied."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notif.mark_as_read()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response(
            {
                "detail": "Notification marked as read.",
                "id": str(notif.id),
                "is_read": True,
                "read_at": notif.read_at,
                "unread_count": unread_count,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_as_read(self, request):
        """
        Mark all unread notifications for the current user as read in bulk.
        POST /api/v1/notifications/mark-all-read/
        """
        now = timezone.now()
        updated_rows = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True, read_at=now)

        return Response(
            {
                "detail": f"Marked {updated_rows} notifications as read.",
                "updated_count": updated_rows,
                "unread_count": 0,
            },
            status=status.HTTP_200_OK,
        )
