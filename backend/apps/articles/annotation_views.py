import uuid
import datetime
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
from apps.notifications.dispatchers import (
    DiscussionNotificationDispatcher,
    SlackWebhookBridge,
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
        preset_param = request.query_params.get("preset", "").lower().strip()

        qs = (
            ArticleInlineAnnotation.objects.filter(article=article)
            .select_related("author", "resolved_by")
            .order_by("created_at")
        )

        if status_param == "open":
            qs = qs.filter(status=ArticleInlineAnnotation.Status.OPEN)
        elif status_param == "resolved":
            qs = qs.filter(status=ArticleInlineAnnotation.Status.RESOLVED)

        # Multi-Criteria Filter Presets
        if preset_param in ["my_mentions", "mentions"]:
            user_mention = f"@{request.user.username}"
            qs = qs.filter(
                models.Q(content__icontains=user_mention)
                | models.Q(replies__content__icontains=user_mention)
            ).distinct()
        elif preset_param in ["needs_review", "review"]:
            user_mention = f"@{request.user.username}"
            qs = qs.filter(status=ArticleInlineAnnotation.Status.OPEN).filter(
                models.Q(article__author=request.user)
                | models.Q(content__icontains=user_mention)
            ).distinct()
        elif preset_param == "stale":
            stale_cutoff = timezone.now() - datetime.timedelta(hours=48)
            qs = qs.filter(status=ArticleInlineAnnotation.Status.OPEN, created_at__lte=stale_cutoff)
        elif preset_param in ["my_threads", "created_by_me"]:
            qs = qs.filter(author=request.user)

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

            # Multi-channel notification dispatch (In-App, Email, Slack/Teams Webhook)
            try:
                DiscussionNotificationDispatcher.dispatch_annotation_created(annotation, request.user)
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
            try:
                DiscussionNotificationDispatcher.dispatch_annotation_resolved(annotation, request.user)
            except Exception:
                pass
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

        # Multi-channel notification dispatch (In-App, Email, Slack/Teams Webhook)
        try:
            DiscussionNotificationDispatcher.dispatch_reply_created(reply, request.user)
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
    Compute and return discussion velocity, resolution metrics, and preset counts.
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

        # Multi-Criteria Filter Preset Counters for current user
        now = timezone.now()
        stale_cutoff = now - datetime.timedelta(hours=48)
        user_mention = f"@{request.user.username}"

        preset_counts = {
            "all": total_annotations,
            "my_mentions": all_annotations.filter(
                models.Q(content__icontains=user_mention)
                | models.Q(replies__content__icontains=user_mention)
            ).distinct().count(),
            "needs_review": all_annotations.filter(
                status=ArticleInlineAnnotation.Status.OPEN
            ).filter(
                models.Q(article__author=request.user)
                | models.Q(content__icontains=user_mention)
            ).distinct().count(),
            "stale": all_annotations.filter(
                status=ArticleInlineAnnotation.Status.OPEN,
                created_at__lte=stale_cutoff,
            ).count(),
            "my_threads": all_annotations.filter(author=request.user).count(),
        }

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
            "preset_counts": preset_counts,
        }, status=status.HTTP_200_OK)


class ArticleInlineAnnotationWebhookTestView(APIView):
    """
    Test or preview external Slack / Teams webhook payload delivery for an inline discussion.
    URL: POST /api/v1/articles/<slug_or_id>/annotations/webhook/test/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)
        annotation_id = request.data.get("annotation_id")
        webhook_url = request.data.get("webhook_url", "").strip() or None

        if annotation_id:
            annotation = get_object_or_404(ArticleInlineAnnotation, id=annotation_id, article=article)
        else:
            annotation = ArticleInlineAnnotation.objects.filter(article=article).first()
            if not annotation:
                class DummyAnnotation:
                    id = "demo-annotation-001"
                    article = article
                    highlighted_text = "Sample highlighted knowledge base text for webhook validation."
                    content = "This is a simulated discussion comment verifying Slack Block Kit integration."
                annotation = DummyAnnotation()

        payload = SlackWebhookBridge.format_annotation_created_payload(annotation, request.user)
        result = SlackWebhookBridge.send_slack_webhook(payload, webhook_url=webhook_url)

        return Response({
            "article_slug": article.slug,
            "target_webhook_url": webhook_url or "Simulated Default",
            "dispatch_result": result,
            "payload": payload,
        }, status=status.HTTP_200_OK)



