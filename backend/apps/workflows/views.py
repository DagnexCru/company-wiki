from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.articles.models import Article
from apps.workflows.models import ReviewRecord
from apps.workflows.permissions import IsReviewerOrAdmin
from apps.workflows.serializers import (
    ReviewQueueArticleSerializer,
    ReviewRecordSerializer,
)


class ReviewQueueView(generics.ListAPIView):
    """
    API endpoint listing articles currently awaiting editorial review.
    Restricted strictly to Reviewers and Administrators.
    Orders articles FIFO (first submitted first reviewed) to maintain queue fairness.
    """

    permission_classes = [permissions.IsAuthenticated, IsReviewerOrAdmin]
    serializer_class = ReviewQueueArticleSerializer

    def get_queryset(self):
        queryset = (
            Article.objects.filter(status=Article.Status.IN_REVIEW)
            .select_related("author", "category")
            .prefetch_related("tags")
        )

        search_query = self.request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query)
                | models.Q(summary__icontains=search_query)
                | models.Q(author__username__icontains=search_query)
                | models.Q(category__name__icontains=search_query)
            )

        category_filter = self.request.query_params.get("category")
        if category_filter and category_filter.lower() != "all":
            try:
                import uuid
                uuid.UUID(str(category_filter))
                queryset = queryset.filter(
                    models.Q(category__id=category_filter) | models.Q(category__slug=category_filter)
                )
            except (ValueError, AttributeError):
                queryset = queryset.filter(category__slug=category_filter)

        return queryset.order_by("submitted_at", "created_at")


class WorkflowHistoryView(generics.ListAPIView):
    """
    API endpoint listing recent review events across all articles.
    Accessible to Reviewers and Administrators for audit and oversight.
    """

    permission_classes = [permissions.IsAuthenticated, IsReviewerOrAdmin]
    serializer_class = ReviewRecordSerializer

    def get_queryset(self):
        return (
            ReviewRecord.objects.all()
            .select_related("article", "actor")
            .order_by("-created_at")[:50]
        )
