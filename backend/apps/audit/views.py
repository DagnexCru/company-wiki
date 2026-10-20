from datetime import timedelta
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.audit.models import AuditEvent
from apps.audit.permissions import IsAdminUserOnly
from apps.audit.serializers import AuditEventSerializer, AuditEventListSerializer


class AuditPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "current_page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API endpoint for administrative inspection of system audit events.
    Enforces strict ADMIN-only role authorization and provides server-side filtering.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]
    pagination_class = AuditPagination

    def get_serializer_class(self):
        if self.action == "list":
            return AuditEventListSerializer
        return AuditEventSerializer

    def get_queryset(self):
        queryset = AuditEvent.objects.select_related("actor").order_by("-created_at")

        # 1. Action Filter
        action_param = self.request.query_params.get("action")
        if action_param and action_param.lower() != "all":
            queryset = queryset.filter(action=action_param)

        # 2. Resource Type Filter
        resource_param = self.request.query_params.get("resource_type")
        if resource_param and resource_param.lower() != "all":
            queryset = queryset.filter(resource_type=resource_param)

        # 3. Actor Username Filter
        actor_param = self.request.query_params.get("actor")
        if actor_param:
            queryset = queryset.filter(actor__username=actor_param)

        # 4. Search Filter (searches resource_name, resource_id, actor username)
        search_query = self.request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(
                models.Q(resource_name__icontains=search_query)
                | models.Q(resource_id__icontains=search_query)
                | models.Q(actor__username__icontains=search_query)
            )

        # 5. Date Range Filters
        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        return queryset

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated, IsAdminUserOnly])
    def summary(self, request):
        """
        GET /api/v1/audit/events/summary/
        Provides aggregate audit statistics for administrative oversight.
        """
        now = timezone.now()
        yesterday = now - timedelta(days=1)

        total_count = AuditEvent.objects.count()
        last_24h_count = AuditEvent.objects.filter(created_at__gte=yesterday).count()

        # Action distribution
        action_counts = dict(
            AuditEvent.objects.values("action")
            .annotate(count=models.Count("id"))
            .order_by("-count")[:10]
            .values_list("action", "count")
        )

        # Resource distribution
        resource_counts = dict(
            AuditEvent.objects.values("resource_type")
            .annotate(count=models.Count("id"))
            .order_by("-count")[:10]
            .values_list("resource_type", "count")
        )

        # Top active actors
        top_actors = list(
            AuditEvent.objects.filter(actor__isnull=False)
            .values("actor__username", "actor__role")
            .annotate(event_count=models.Count("id"))
            .order_by("-event_count")[:5]
        )

        return Response({
            "total_events": total_count,
            "events_last_24h": last_24h_count,
            "action_distribution": action_counts,
            "resource_distribution": resource_counts,
            "top_actors": top_actors,
        }, status=status.HTTP_200_OK)
