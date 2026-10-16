from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.articles.models import Article
from apps.articles.permissions import CanCreateArticle, IsAuthorOrAdmin
from apps.articles.serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination for knowledge articles providing page and page_size controls.
    """
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class ArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing knowledge articles.
    Provides role-aware listing, retrieval, authoring, updating, and archival.
    """

    lookup_field = "slug"
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        """
        Assign granular permissions according to the operation:
        - List / Retrieve: Any authenticated user (internal wiki).
        - Create: Authors and Admins only.
        - Update / Partial Update / Destroy / Archive: Author of the article or Admin.
        """
        if self.action == "create":
            permission_classes = [permissions.IsAuthenticated, CanCreateArticle]
        elif self.action in ["update", "partial_update", "destroy", "archive"]:
            permission_classes = [permissions.IsAuthenticated, IsAuthorOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Server-side role-based queryset filtering:
        - Admin: sees all articles.
        - Reviewer: sees published + in_review + their own.
        - Author: sees published + their own drafts.
        - Reader: sees only published articles.
        """
        user = self.request.user
        queryset = Article.objects.for_user(user).select_related("author")

        # Optional query param filters
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        author_filter = self.request.query_params.get("author")
        if author_filter:
            queryset = queryset.filter(
                models.Q(author__username=author_filter) | models.Q(author__id=author_filter)
            )

        search_query = self.request.query_params.get("search")
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query)
                | models.Q(summary__icontains=search_query)
                | models.Q(content__icontains=search_query)
            )

        return queryset.order_by("-updated_at")

    def get_serializer_class(self):
        """
        Select serializer according to action:
        - list: lightweight summary
        - retrieve: full document content
        - create/update: validated input fields
        """
        if self.action == "list":
            return ArticleListSerializer
        elif self.action == "retrieve":
            return ArticleDetailSerializer
        return ArticleCreateUpdateSerializer

    def perform_create(self, serializer):
        """
        Assign authenticated author and enforce default draft status.
        """
        serializer.save(author=self.request.user, status=Article.Status.DRAFT)

    def destroy(self, request, *args, **kwargs):
        """
        Safe deletion and archival:
        - Drafts: permanently deleted.
        - Published / In-Review: soft-archived to preserve audit history and avoid dead links.
        - Admin with ?permanent=true: hard delete.
        """
        article = self.get_object()
        permanent = request.query_params.get("permanent", "").lower() in ["true", "1"]

        if article.status == Article.Status.DRAFT or (permanent and request.user.is_admin):
            article.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Soft archive for active content
        article.status = Article.Status.ARCHIVED
        article.save(update_fields=["status", "updated_at"])
        return Response(
            {"detail": "Article archived successfully.", "status": article.status},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsAuthorOrAdmin])
    def archive(self, request, slug=None):
        """
        Explicitly archive an article.
        POST /api/v1/articles/{slug}/archive/
        """
        article = self.get_object()
        article.status = Article.Status.ARCHIVED
        article.save(update_fields=["status", "updated_at"])
        return Response(
            {"detail": "Article moved to archive.", "status": article.status},
            status=status.HTTP_200_OK,
        )
