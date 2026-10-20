from django.db import models
from rest_framework import viewsets
from apps.taxonomy.models import Category, Tag
from apps.taxonomy.serializers import CategorySerializer, TagSerializer
from apps.taxonomy.permissions import IsAdminOrReadOnly
from apps.audit.models import AuditEvent
from apps.audit.services import log_audit_event


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD API for knowledge Categories.
    - Read (list/retrieve): All authenticated staff.
    - Write (create/update/delete): Administrators only.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None  # Full list returned for easy UI taxonomy selection & sidebar

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                models.Q(name__icontains=search) | models.Q(description__icontains=search)
            )
        return qs.order_by("name")

    def perform_create(self, serializer):
        category = serializer.save()
        log_audit_event(
            action=AuditEvent.Action.CATEGORY_CREATE,
            resource_type="category",
            actor=self.request.user,
            resource_id=category.id,
            resource_name=category.name,
            details={"slug": category.slug},
            request=self.request,
        )

    def perform_update(self, serializer):
        category = serializer.save()
        log_audit_event(
            action=AuditEvent.Action.CATEGORY_UPDATE,
            resource_type="category",
            actor=self.request.user,
            resource_id=category.id,
            resource_name=category.name,
            details={"slug": category.slug},
            request=self.request,
        )

    def perform_destroy(self, instance):
        log_audit_event(
            action=AuditEvent.Action.CATEGORY_DELETE,
            resource_type="category",
            actor=self.request.user,
            resource_id=instance.id,
            resource_name=instance.name,
            details={"slug": instance.slug},
            request=self.request,
        )
        instance.delete()


class TagViewSet(viewsets.ModelViewSet):
    """
    CRUD API for knowledge Tags.
    - Read (list/retrieve): All authenticated staff.
    - Write (create/update/delete): Administrators only.
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = "slug"
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)
        return qs.order_by("name")

    def perform_create(self, serializer):
        tag = serializer.save()
        log_audit_event(
            action=AuditEvent.Action.TAG_CREATE,
            resource_type="tag",
            actor=self.request.user,
            resource_id=tag.id,
            resource_name=tag.name,
            details={"slug": tag.slug},
            request=self.request,
        )

    def perform_update(self, serializer):
        tag = serializer.save()
        log_audit_event(
            action=AuditEvent.Action.TAG_UPDATE,
            resource_type="tag",
            actor=self.request.user,
            resource_id=tag.id,
            resource_name=tag.name,
            details={"slug": tag.slug},
            request=self.request,
        )

    def perform_destroy(self, instance):
        log_audit_event(
            action=AuditEvent.Action.TAG_DELETE,
            resource_type="tag",
            actor=self.request.user,
            resource_id=instance.id,
            resource_name=instance.name,
            details={"slug": instance.slug},
            request=self.request,
        )
        instance.delete()


# Querysets: Pre-sorted by name ascending for consistent UI rendering.

