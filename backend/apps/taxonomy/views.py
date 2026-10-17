from django.db import models
from rest_framework import viewsets
from apps.taxonomy.models import Category, Tag
from apps.taxonomy.serializers import CategorySerializer, TagSerializer
from apps.taxonomy.permissions import IsAdminOrReadOnly


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

# Querysets: Pre-sorted by name ascending for consistent UI rendering.
