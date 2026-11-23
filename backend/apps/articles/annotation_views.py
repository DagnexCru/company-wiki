import uuid
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.articles.models import Article, ArticleInlineAnnotation
from apps.articles.serializers import ArticleInlineAnnotationSerializer


def get_article_by_slug_or_id(slug_or_id):
    """
    Look up article by either UUID primary key or unique URL slug.
    """
    try:
        val = uuid.UUID(str(slug_or_id))
        return Article.objects.get(id=val)
    except (ValueError, AttributeError):
        return get_object_or_404(Article, slug=slug_or_id)


class ArticleInlineAnnotationListView(APIView):
    """
    List or create in-line text annotations attached to an article.
    URL: /api/v1/articles/<slug_or_id>/annotations/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)

        # Enforce draft permissions
        if article.status != Article.Status.PUBLISHED:
            is_author = article.author_id == request.user.id
            is_staff = (
                getattr(request.user, "role", "") in ["ADMIN", "REVIEWER"]
                or getattr(request.user, "is_admin", False)
            )
            if not (is_author or is_staff):
                return Response(
                    {"detail": "You do not have permission to view annotations on this article."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        status_param = request.query_params.get("status", "all").lower().strip()
        qs = (
            ArticleInlineAnnotation.objects.filter(article=article)
            .select_related("author", "resolved_by")
            .order_by("created_at")
        )

        if status_param == "open":
            qs = qs.filter(status=ArticleInlineAnnotation.Status.OPEN)
        elif status_param == "resolved":
            qs = qs.filter(status=ArticleInlineAnnotation.Status.RESOLVED)

        serializer = ArticleInlineAnnotationSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)

        # Enforce draft permissions
        if article.status != Article.Status.PUBLISHED:
            is_author = article.author_id == request.user.id
            is_staff = (
                getattr(request.user, "role", "") in ["ADMIN", "REVIEWER"]
                or getattr(request.user, "is_admin", False)
            )
            if not (is_author or is_staff):
                return Response(
                    {"detail": "You do not have permission to annotate this article."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        data = request.data.copy()
        data["article"] = article.id

        serializer = ArticleInlineAnnotationSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            annotation = serializer.save(article=article, author=request.user)
            return Response(
                ArticleInlineAnnotationSerializer(annotation, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ArticleInlineAnnotationDetailView(APIView):
    """
    Retrieve, update or delete an inline annotation.
    URL: /api/v1/articles/<slug_or_id>/annotations/<annotation_id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_annotation(self, slug_or_id, annotation_id):
        article = get_article_by_slug_or_id(slug_or_id)
        return get_object_or_404(ArticleInlineAnnotation, id=annotation_id, article=article)

    def patch(self, request, slug_or_id, annotation_id):
        annotation = self.get_annotation(slug_or_id, annotation_id)
        is_owner = annotation.author_id == request.user.id
        is_admin = getattr(request.user, "role", "") == "ADMIN" or getattr(request.user, "is_admin", False)

        if not (is_owner or is_admin):
            return Response(
                {"detail": "You do not have permission to edit this annotation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        content = request.data.get("content")
        if content:
            annotation.content = content.strip()
            annotation.save(update_fields=["content", "updated_at"])

        return Response(
            ArticleInlineAnnotationSerializer(annotation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug_or_id, annotation_id):
        annotation = self.get_annotation(slug_or_id, annotation_id)
        is_owner = annotation.author_id == request.user.id
        is_article_owner = annotation.article.author_id == request.user.id
        is_admin = getattr(request.user, "role", "") == "ADMIN" or getattr(request.user, "is_admin", False)

        if not (is_owner or is_article_owner or is_admin):
            return Response(
                {"detail": "You do not have permission to delete this annotation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        annotation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArticleInlineAnnotationResolveView(APIView):
    """
    Resolve or reopen an inline annotation discussion.
    URL: /api/v1/articles/<slug_or_id>/annotations/<annotation_id>/<action:resolve|reopen>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id, annotation_id, action):
        article = get_article_by_slug_or_id(slug_or_id)
        annotation = get_object_or_404(ArticleInlineAnnotation, id=annotation_id, article=article)

        if action == "resolve":
            annotation.resolve(request.user)
        elif action == "reopen":
            annotation.reopen()
        else:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            ArticleInlineAnnotationSerializer(annotation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
