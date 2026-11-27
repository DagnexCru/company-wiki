import uuid
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.articles.models import Article, ArticleInlineAnnotation, ArticleInlineAnnotationReply
from apps.articles.serializers import (
    ArticleInlineAnnotationSerializer,
    ArticleInlineAnnotationReplySerializer,
)


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
        author_param = request.query_params.get("author", "").strip()
        search_query = request.query_params.get("search", "").strip()
        mentioned_param = request.query_params.get("mentioned", "").strip()

        qs = (
            ArticleInlineAnnotation.objects.filter(article=article)
            .select_related("author", "resolved_by")
            .order_by("created_at")
        )

        if status_param == "open":
            qs = qs.filter(status=ArticleInlineAnnotation.Status.OPEN)
        elif status_param == "resolved":
            qs = qs.filter(status=ArticleInlineAnnotation.Status.RESOLVED)

        if author_param:
            qs = qs.filter(
                models.Q(author__username__iexact=author_param)
                | models.Q(author__id__iexact=author_param)
            )

        if search_query:
            qs = qs.filter(
                models.Q(highlighted_text__icontains=search_query)
                | models.Q(content__icontains=search_query)
                | models.Q(replies__content__icontains=search_query)
            ).distinct()

        if mentioned_param:
            clean_mention = mentioned_param.lstrip("@")
            mention_token = f"@{clean_mention}"
            qs = qs.filter(
                models.Q(content__icontains=mention_token)
                | models.Q(replies__content__icontains=mention_token)
            ).distinct()

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

            # Trigger @username mentions notifications if any
            try:
                from apps.notifications.services import parse_and_notify_mentions
                actor_name = request.user.full_name or request.user.username
                parse_and_notify_mentions(
                    text=annotation.content,
                    actor=request.user,
                    link=f"/articles/{article.slug}?annotation={annotation.id}",
                    article=article,
                    custom_title=f"{actor_name} mentioned you in an inline annotation on '{article.title}'",
                )
            except Exception:
                pass

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


class ArticleInlineAnnotationRealignView(APIView):
    """
    Realign all inline annotations for an article using the Fuzzy Anchor Matching Engine.
    URL: /api/v1/articles/<slug_or_id>/annotations/realign/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)
        from apps.articles.anchor_service import AnchorResilienceService

        realigned_data = AnchorResilienceService.realign_article_annotations(article)
        return Response({
            "article_slug": article.slug,
            "realigned_count": len(realigned_data),
            "annotations": realigned_data,
        }, status=status.HTTP_200_OK)


class ArticleInlineAnnotationReplyListView(APIView):
    """
    List or create threaded replies attached to an inline annotation.
    URL: /api/v1/articles/<slug_or_id>/annotations/<annotation_id>/replies/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug_or_id, annotation_id):
        article = get_article_by_slug_or_id(slug_or_id)
        annotation = get_object_or_404(ArticleInlineAnnotation, id=annotation_id, article=article)

        # Retrieve top-level replies (parent=None) with nested children pre-fetched
        replies = (
            ArticleInlineAnnotationReply.objects.filter(annotation=annotation, parent=None)
            .select_related("author")
            .prefetch_related("children__author")
            .order_by("created_at")
        )
        serializer = ArticleInlineAnnotationReplySerializer(replies, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug_or_id, annotation_id):
        article = get_article_by_slug_or_id(slug_or_id)
        annotation = get_object_or_404(ArticleInlineAnnotation, id=annotation_id, article=article)

        content = request.data.get("content", "").strip()
        if not content:
            return Response({"detail": "Reply content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        parent_id = request.data.get("parent") or request.data.get("parent_id")
        parent = None
        if parent_id:
            parent = get_object_or_404(ArticleInlineAnnotationReply, id=parent_id, annotation=annotation)

        reply = ArticleInlineAnnotationReply.objects.create(
            annotation=annotation,
            author=request.user,
            parent=parent,
            content=content,
        )

        # Trigger @username mentions notifications & thread participant notifications
        try:
            from apps.notifications.services import parse_and_notify_mentions
            from apps.notifications.models import Notification

            actor_name = request.user.full_name or request.user.username
            link = f"/articles/{article.slug}?annotation={annotation.id}"

            # 1. Notify mentioned teammates
            mentioned_notifs = parse_and_notify_mentions(
                text=content,
                actor=request.user,
                link=link,
                article=article,
                custom_title=f"{actor_name} mentioned you in an inline discussion on '{article.title}'",
            )
            already_notified_user_ids = {n.recipient_id for n in mentioned_notifs}

            # 2. Notify annotation author if different from replier and not already notified
            if annotation.author_id != request.user.id and annotation.author_id not in already_notified_user_ids:
                Notification.objects.create(
                    recipient=annotation.author,
                    sender=request.user,
                    notification_type=Notification.NotificationType.COMMENT,
                    title=f"{actor_name} replied to your inline annotation",
                    message=content[:150] + ("..." if len(content) > 150 else ""),
                    link=link,
                    article=article,
                )
                already_notified_user_ids.add(annotation.author_id)

            # 3. If nested reply, notify parent reply author if different
            if parent and parent.author_id != request.user.id and parent.author_id not in already_notified_user_ids:
                Notification.objects.create(
                    recipient=parent.author,
                    sender=request.user,
                    notification_type=Notification.NotificationType.COMMENT,
                    title=f"{actor_name} replied to your comment in the discussion tree",
                    message=content[:150] + ("..." if len(content) > 150 else ""),
                    link=link,
                    article=article,
                )
        except Exception:
            pass

        serializer = ArticleInlineAnnotationReplySerializer(reply, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ArticleInlineAnnotationReplyDetailView(APIView):
    """
    Delete an inline annotation reply.
    URL: /api/v1/articles/<slug_or_id>/annotations/<annotation_id>/replies/<reply_id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, slug_or_id, annotation_id, reply_id):
        article = get_article_by_slug_or_id(slug_or_id)
        annotation = get_object_or_404(ArticleInlineAnnotation, id=annotation_id, article=article)
        reply = get_object_or_404(ArticleInlineAnnotationReply, id=reply_id, annotation=annotation)

        is_owner = reply.author_id == request.user.id
        is_article_owner = article.author_id == request.user.id
        is_admin = getattr(request.user, "role", "") == "ADMIN" or getattr(request.user, "is_admin", False)

        if not (is_owner or is_article_owner or is_admin):
            return Response(
                {"detail": "You do not have permission to delete this reply."},
                status=status.HTTP_403_FORBIDDEN,
            )

        reply.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArticleInlineAnnotationMetricsView(APIView):
    """
    Compute and return discussion velocity and resolution metrics for an article's inline annotations.
    URL: GET /api/v1/articles/<slug_or_id>/annotations/metrics/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)

        all_annotations = ArticleInlineAnnotation.objects.filter(article=article)
        total_annotations = all_annotations.count()
        open_count = all_annotations.filter(status=ArticleInlineAnnotation.Status.OPEN).count()
        resolved_annotations = all_annotations.filter(status=ArticleInlineAnnotation.Status.RESOLVED)
        resolved_count = resolved_annotations.count()

        resolution_rate = (
            round((resolved_count / total_annotations * 100), 1)
            if total_annotations > 0
            else 100.0
        )

        all_replies = ArticleInlineAnnotationReply.objects.filter(annotation__article=article)
        total_replies = all_replies.count()

        # Calculate average resolution time (in hours) for resolved threads
        resolution_durations = []
        for ann in resolved_annotations:
            if ann.resolved_at and ann.created_at:
                diff_seconds = (ann.resolved_at - ann.created_at).total_seconds()
                if diff_seconds >= 0:
                    resolution_durations.append(diff_seconds / 3600.0)

        avg_resolution_time = (
            round(sum(resolution_durations) / len(resolution_durations), 1)
            if resolution_durations
            else None
        )

        # Contributor metrics (authors of annotations + replies)
        user_contribution_counts = {}
        for ann in all_annotations.select_related("author"):
            u = ann.author
            key = u.username
            if key not in user_contribution_counts:
                user_contribution_counts[key] = {
                    "username": u.username,
                    "full_name": u.full_name or u.username,
                    "contributions_count": 0,
                }
            user_contribution_counts[key]["contributions_count"] += 1

        for rep in all_replies.select_related("author"):
            u = rep.author
            key = u.username
            if key not in user_contribution_counts:
                user_contribution_counts[key] = {
                    "username": u.username,
                    "full_name": u.full_name or u.username,
                    "contributions_count": 0,
                }
            user_contribution_counts[key]["contributions_count"] += 1

        top_contributors = sorted(
            user_contribution_counts.values(),
            key=lambda x: x["contributions_count"],
            reverse=True,
        )[:5]

        return Response({
            "article_slug": article.slug,
            "total_annotations": total_annotations,
            "open_count": open_count,
            "resolved_count": resolved_count,
            "resolution_rate": resolution_rate,
            "total_replies": total_replies,
            "avg_resolution_time_hours": avg_resolution_time,
            "contributors_count": len(user_contribution_counts),
            "top_contributors": top_contributors,
        }, status=status.HTTP_200_OK)


