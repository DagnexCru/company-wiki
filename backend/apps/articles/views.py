import difflib
import datetime
import csv
import io
import json
from django.db import models
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.articles.models import Article, ArticleRevision, ArticleAttachment, ArticleFeedback, ArticleComment, ArticleBookmark, ArticleChecklistProgress, ArticleViewLog, ArticleEngagementSession
from apps.notifications.services import notify_review_action, notify_article_updated, parse_and_notify_mentions
from apps.notifications.models import Notification
from apps.articles.permissions import CanCreateArticle, IsAuthorOrAdmin
from apps.articles.serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer,
    ArticleRevisionSerializer,
    ArticleRevisionListSerializer,
    ArticleAttachmentSerializer,
    ArticleCommentSerializer,
    ArticleBookmarkSerializer,
    ArticleChecklistProgressSerializer,
)
from apps.workflows.models import ReviewRecord
from apps.workflows.serializers import ReviewRecordSerializer
from apps.workflows.permissions import IsReviewerOrAdmin
from apps.audit.models import AuditEvent
from apps.audit.services import log_audit_event


ALLOWED_ORDERING_FIELDS = {
    "created_at",
    "-created_at",
    "updated_at",
    "-updated_at",
    "title",
    "-title",
    "published_at",
    "-published_at",
    "status",
    "-status",
    "view_count",
    "-view_count",
}


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination for knowledge articles providing page and page_size controls
    along with total_pages and current_page metadata.
    """
    page_size = 9
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


class ArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing knowledge articles.
    Provides role-aware listing, search, filtering, safe sorting, retrieval, authoring, and archival.
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
        elif self.action == "submit":
            permission_classes = [permissions.IsAuthenticated, IsAuthorOrAdmin]
        elif self.action in ["approve", "reject"]:
            permission_classes = [permissions.IsAuthenticated, IsReviewerOrAdmin]
        elif self.action in ["reviews", "revisions", "revision_detail", "revision_diff", "restore_revision"]:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == "ping_engagement":
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Server-side role-based queryset filtering:
        - Workflow and revision actions: allows object lookup across articles
          so specific status validation and object permissions can be evaluated cleanly.
        - Admin: sees all articles.
        - Reviewer: sees published + in_review + their own.
        - Author: sees published + their own drafts.
        - Reader: sees only published articles.
        Followed by validated search, category/tag/status/author filters, and whitelisted sorting.
        """
        if self.action in [
            "approve",
            "reject",
            "submit",
            "reviews",
            "revisions",
            "revision_detail",
            "revision_diff",
            "restore_revision",
            "feedback",
            "feedbacks",
            "record_view",
            "ping_engagement",
            "views_timeline",
            "sentiment",
            "engagement",
            "export_analytics",
            "export_document",
        ]:
            return Article.objects.all().select_related("author", "category").prefetch_related("tags")

        user = self.request.user
        queryset = (
            Article.objects.for_user(user)
            .select_related("author", "category")
            .prefetch_related("tags")
        )

        # 1. Status Filter (respects role visibility applied by for_user)
        status_filter = self.request.query_params.get("status")
        if status_filter and status_filter.lower() != "all":
            if status_filter in Article.Status.values:
                queryset = queryset.filter(status=status_filter)

        # 2. Category Filter (by slug or UUID id or name)
        category_filter = self.request.query_params.get("category")
        if category_filter and category_filter.lower() != "all":
            try:
                import uuid
                uuid.UUID(str(category_filter))
                queryset = queryset.filter(
                    models.Q(category__id=category_filter) | models.Q(category__slug=category_filter)
                )
            except (ValueError, AttributeError):
                queryset = queryset.filter(
                    models.Q(category__slug=category_filter) | models.Q(category__name__iexact=category_filter)
                )

        # 3. Tag Filter (by slug or UUID id or name; supports comma-separated tags)
        tag_filter = self.request.query_params.get("tag")
        if tag_filter:
            tag_slugs = [t.strip() for t in tag_filter.split(",") if t.strip()]
            if tag_slugs:
                tag_q = models.Q()
                for t in tag_slugs:
                    try:
                        import uuid
                        uuid.UUID(str(t))
                        tag_q |= models.Q(tags__id=t) | models.Q(tags__slug=t)
                    except (ValueError, AttributeError):
                        tag_q |= models.Q(tags__slug=t) | models.Q(tags__name__iexact=t)
                queryset = queryset.filter(tag_q).distinct()

        # 4. Author Filter (by username or UUID id)
        author_filter = self.request.query_params.get("author")
        if author_filter:
            try:
                import uuid
                uuid.UUID(str(author_filter))
                queryset = queryset.filter(
                    models.Q(author__id=author_filter) | models.Q(author__username=author_filter)
                )
            except (ValueError, AttributeError):
                queryset = queryset.filter(author__username=author_filter)

        # 5. Full Search across Title, Summary, Content, Tag names, and Category names
        search_query = self.request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query)
                | models.Q(summary__icontains=search_query)
                | models.Q(content__icontains=search_query)
                | models.Q(tags__name__icontains=search_query)
                | models.Q(category__name__icontains=search_query)
            ).distinct()

        # 6. Validated Whitelisted Sorting
        ordering_param = self.request.query_params.get("ordering") or self.request.query_params.get("sort")
        validated_orderings = []
        if ordering_param:
            candidates = [field.strip() for field in ordering_param.split(",") if field.strip()]
            for cand in candidates:
                if cand in ALLOWED_ORDERING_FIELDS:
                    validated_orderings.append(cand)

        if validated_orderings:
            return queryset.order_by(*validated_orderings)

        # Default fallback sorting
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

    def get_object(self):
        """
        Safely resolve article instance by slug or UUID without UUID validation exceptions.
        """
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg)

        filter_q = models.Q(slug=lookup_val)
        try:
            import uuid
            val_uuid = uuid.UUID(str(lookup_val))
            filter_q |= models.Q(id=val_uuid)
        except (ValueError, AttributeError):
            pass

        obj = queryset.filter(filter_q).first()
        if obj is None:
            from django.http import Http404
            raise Http404(f"No article found matching '{lookup_val}'.")

        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        """
        Assign authenticated author, enforce default draft status,
        create initial revision #1, and log an audit event.
        """
        article = serializer.save(author=self.request.user, status=Article.Status.DRAFT)
        article.create_revision(
            author=self.request.user,
            change_summary="Initial draft created",
        )
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_CREATE,
            resource_type="article",
            actor=self.request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={"slug": article.slug, "status": article.status},
            request=self.request,
        )

    def perform_update(self, serializer):
        """
        Update article, create a new revision snapshot if content changed,
        and log an audit event.
        """
        instance = self.get_object()
        old_title = instance.title
        old_summary = instance.summary
        old_content = instance.content

        article = serializer.save()
        change_summary = self.request.data.get("change_summary", "").strip()

        # Check if content/title/summary changed or explicit summary provided
        if (
            article.title != old_title
            or article.summary != old_summary
            or article.content != old_content
            or change_summary
        ):
            article.create_revision(
                author=self.request.user,
                change_summary=change_summary or "Article updated",
            )
        if self.request.user and article.author and article.author != self.request.user:
            notify_article_updated(article, self.request.user)

        log_audit_event(
            action=AuditEvent.Action.ARTICLE_UPDATE,
            resource_type="article",
            actor=self.request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={
                "slug": article.slug,
                "change_summary": change_summary or "Article updated",
            },
            request=self.request,
        )

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
            log_audit_event(
                action=AuditEvent.Action.ARTICLE_DELETE,
                resource_type="article",
                actor=request.user,
                resource_id=article.id,
                resource_name=article.title,
                details={"slug": article.slug, "permanent": permanent},
                request=request,
            )
            article.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Soft archive for active content
        article.status = Article.Status.ARCHIVED
        article.save(update_fields=["status", "updated_at"])
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_ARCHIVE,
            resource_type="article",
            actor=request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={"slug": article.slug},
            request=request,
        )
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
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_ARCHIVE,
            resource_type="article",
            actor=request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={"slug": article.slug},
            request=request,
        )
        return Response(
            {"detail": "Article moved to archive.", "status": article.status},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsAuthorOrAdmin])
    def submit(self, request, slug=None):
        """
        Submit a draft or rejected article for editorial review.
        POST /api/v1/articles/{slug}/submit/
        """
        article = self.get_object()
        if article.status not in [Article.Status.DRAFT, Article.Status.REJECTED]:
            return Response(
                {"detail": f"Only drafts or rejected articles can be submitted for review. Current status is '{article.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_status = article.status
        now = timezone.now()
        article.status = Article.Status.IN_REVIEW
        article.submitted_at = now
        article.save(update_fields=["status", "submitted_at", "updated_at"])

        notes = request.data.get("notes", request.data.get("feedback", "")).strip()
        ReviewRecord.objects.create(
            article=article,
            actor=request.user,
            action=ReviewRecord.Action.SUBMIT,
            from_status=prev_status,
            to_status=Article.Status.IN_REVIEW,
            feedback=notes,
        )
        notify_review_action(article, request.user, "SUBMIT", feedback=notes)
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_SUBMIT,
            resource_type="article",
            actor=request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={"slug": article.slug, "from_status": prev_status, "to_status": Article.Status.IN_REVIEW},
            request=request,
        )

        return Response(
            {
                "detail": "Article submitted for review successfully.",
                "status": article.status,
                "status_display": article.get_status_display(),
                "submitted_at": article.submitted_at,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsReviewerOrAdmin])
    def approve(self, request, slug=None):
        """
        Approve an article currently in review and transition it to published.
        POST /api/v1/articles/{slug}/approve/
        Independent review invariant: Authors cannot approve their own articles unless Admin.
        """
        article = self.get_object()

        # Invariant: independent review
        if article.author == request.user and not request.user.is_admin:
            return Response(
                {"detail": "Independent review required: authors cannot approve their own articles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Invariant: must be in_review
        if article.status != Article.Status.IN_REVIEW:
            return Response(
                {"detail": f"Article must be in 'in_review' status to approve. Current status is '{article.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_status = article.status
        now = timezone.now()
        article.status = Article.Status.PUBLISHED
        article.published_at = now
        article.reviewed_at = now
        article.last_reviewer = request.user
        article.rejection_reason = ""
        article.save(update_fields=["status", "published_at", "reviewed_at", "last_reviewer", "rejection_reason", "updated_at"])

        feedback = request.data.get("feedback", "Approved for publication.").strip()
        ReviewRecord.objects.create(
            article=article,
            actor=request.user,
            action=ReviewRecord.Action.APPROVE,
            from_status=prev_status,
            to_status=Article.Status.PUBLISHED,
            feedback=feedback,
        )
        notify_review_action(article, request.user, "APPROVE", feedback=feedback)
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_APPROVE,
            resource_type="article",
            actor=request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={"slug": article.slug, "feedback": feedback},
            request=request,
        )

        return Response(
            {
                "detail": "Article approved and published.",
                "status": article.status,
                "status_display": article.get_status_display(),
                "published_at": article.published_at,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsReviewerOrAdmin])
    def reject(self, request, slug=None):
        """
        Reject an article in review and provide mandatory feedback for author revision.
        POST /api/v1/articles/{slug}/reject/
        Independent review invariant: Authors cannot reject their own articles unless Admin.
        """
        article = self.get_object()

        # Invariant: independent review
        if article.author == request.user and not request.user.is_admin:
            return Response(
                {"detail": "Independent review required: authors cannot review or reject their own articles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Invariant: must be in_review
        if article.status != Article.Status.IN_REVIEW:
            return Response(
                {"detail": f"Article must be in 'in_review' status to reject. Current status is '{article.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feedback = request.data.get("feedback", "").strip()
        if not feedback or len(feedback) < 5:
            return Response(
                {"detail": "Rejection feedback explaining required revisions is mandatory (minimum 5 characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_status = article.status
        now = timezone.now()
        article.status = Article.Status.REJECTED
        article.reviewed_at = now
        article.last_reviewer = request.user
        article.rejection_reason = feedback
        article.save(update_fields=["status", "reviewed_at", "last_reviewer", "rejection_reason", "updated_at"])

        ReviewRecord.objects.create(
            article=article,
            actor=request.user,
            action=ReviewRecord.Action.REJECT,
            from_status=prev_status,
            to_status=Article.Status.REJECTED,
            feedback=feedback,
        )
        notify_review_action(article, request.user, "REJECT", feedback=feedback)
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_REJECT,
            resource_type="article",
            actor=request.user,
            resource_id=article.id,
            resource_name=article.title,
            details={"slug": article.slug, "reason": feedback},
            request=request,
        )

        return Response(
            {
                "detail": "Article rejected with feedback.",
                "status": article.status,
                "status_display": article.get_status_display(),
                "rejection_reason": article.rejection_reason,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def reviews(self, request, slug=None):
        """
        Retrieve chronological audit history of review events for this article.
        GET /api/v1/articles/{slug}/reviews/
        """
        article = self.get_object()
        user = request.user
        if not (user.is_admin or getattr(user, "role", None) in ["REVIEWER"] or article.author == user):
            return Response(
                {"detail": "You do not have permission to inspect review records for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        records = article.review_records.select_related("actor", "article").order_by("-created_at")
        serializer = ReviewRecordSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def revisions(self, request, slug=None):
        """
        Retrieve chronological list of immutable revisions for this article.
        GET /api/v1/articles/{slug}/revisions/
        Permission: Readers cannot access (403); Authors can access their own; Reviewers and Admins can access.
        """
        article = self.get_object()
        user = request.user
        if not (user.is_admin or getattr(user, "role", None) in ["REVIEWER"] or article.author == user):
            return Response(
                {"detail": "You do not have permission to view revision history for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        revisions_qs = article.revisions.select_related("author").order_by("-revision_number")
        serializer = ArticleRevisionListSerializer(revisions_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
        url_path=r"revisions/(?P<rev_num>\d+)",
        permission_classes=[permissions.IsAuthenticated],
    )
    def revision_detail(self, request, slug=None, rev_num=None):
        """
        Retrieve complete snapshot data for a specific revision number.
        GET /api/v1/articles/{slug}/revisions/{rev_num}/
        """
        article = self.get_object()
        user = request.user
        if not (user.is_admin or getattr(user, "role", None) in ["REVIEWER"] or article.author == user):
            return Response(
                {"detail": "You do not have permission to view revision history for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            revision = article.revisions.select_related("author", "article").get(revision_number=rev_num)
        except ArticleRevision.DoesNotExist:
            return Response(
                {"detail": f"Revision #{rev_num} was not found for article '{article.title}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ArticleRevisionSerializer(revision)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
        url_path=r"revisions/diff",
        permission_classes=[permissions.IsAuthenticated],
    )
    def revision_diff(self, request, slug=None):
        """
        Compute line-by-line unified diff and structured change summary between two revisions.
        GET /api/v1/articles/{slug}/revisions/diff/?from={rev1}&to={rev2}
        """
        article = self.get_object()
        user = request.user
        if not (user.is_admin or getattr(user, "role", None) in ["REVIEWER"] or article.author == user):
            return Response(
                {"detail": "You do not have permission to inspect revision differences for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from_param = request.query_params.get("from")
        to_param = request.query_params.get("to")

        if not from_param or not to_param:
            return Response(
                {"detail": "Both 'from' and 'to' query parameters specifying revision numbers are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from_num = int(from_param)
            to_num = int(to_param)
        except ValueError:
            return Response(
                {"detail": "'from' and 'to' query parameters must be valid integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rev_from = article.revisions.select_related("author").get(revision_number=from_num)
        except ArticleRevision.DoesNotExist:
            return Response(
                {"detail": f"Source revision #{from_num} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            rev_to = article.revisions.select_related("author").get(revision_number=to_num)
        except ArticleRevision.DoesNotExist:
            return Response(
                {"detail": f"Target revision #{to_num} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Compute unified line diff on content
        from_lines = rev_from.content.splitlines(keepends=True)
        to_lines = rev_to.content.splitlines(keepends=True)
        unified_diff = list(
            difflib.unified_diff(
                from_lines,
                to_lines,
                fromfile=f"Revision #{rev_from.revision_number}",
                tofile=f"Revision #{rev_to.revision_number}",
            )
        )

        additions = sum(1 for line in unified_diff if line.startswith("+") and not line.startswith("+++"))
        deletions = sum(1 for line in unified_diff if line.startswith("-") and not line.startswith("---"))

        tags_from = set(rev_from.tags_snapshot or [])
        tags_to = set(rev_to.tags_snapshot or [])

        diff_payload = {
            "article_slug": article.slug,
            "article_title": article.title,
            "from_revision": rev_from.revision_number,
            "to_revision": rev_to.revision_number,
            "from_created_at": rev_from.created_at,
            "to_created_at": rev_to.created_at,
            "title_changed": rev_from.title != rev_to.title,
            "from_title": rev_from.title,
            "to_title": rev_to.title,
            "summary_changed": rev_from.summary != rev_to.summary,
            "from_summary": rev_from.summary,
            "to_summary": rev_to.summary,
            "category_changed": rev_from.category_name != rev_to.category_name,
            "from_category": rev_from.category_name,
            "to_category": rev_to.category_name,
            "tags_added": sorted(list(tags_to - tags_from)),
            "tags_removed": sorted(list(tags_from - tags_to)),
            "content_unified_diff": "".join(unified_diff),
            "from_content": rev_from.content,
            "to_content": rev_to.content,
            "stats": {
                "additions": additions,
                "deletions": deletions,
            },
        }
        return Response(diff_payload, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        url_path=r"revisions/(?P<rev_num>\d+)/restore",
        permission_classes=[permissions.IsAuthenticated],
    )
    def restore_revision(self, request, slug=None, rev_num=None):
        """
        Safely restores article content to a specified prior revision snapshot.
        Enforces linear history invariant: Restoring creates a NEW revision #N,
        preserving all intermediate revisions intact without erasing history.
        Permission: Admin can restore any article; Author can restore only drafts/rejected.
        """
        article = self.get_object()
        user = request.user
        is_author = article.author == user
        is_admin = user.is_admin or getattr(user, "role", None) == "ADMIN"

        if not (is_admin or (is_author and article.status in [Article.Status.DRAFT, Article.Status.REJECTED])):
            return Response(
                {
                    "detail": "You do not have permission to restore revisions for this article. "
                    "Authors may only restore articles in draft or rejected status."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            target_rev = article.revisions.get(revision_number=rev_num)
        except ArticleRevision.DoesNotExist:
            return Response(
                {"detail": f"Revision #{rev_num} not found for article '{article.title}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Restore article title, summary, content
        reason = request.data.get("reason", "").strip()
        change_summary = f"Restored from Revision #{target_rev.revision_number}"
        if reason:
            change_summary = f"{change_summary}: {reason}"

        article.title = target_rev.title
        article.summary = target_rev.summary
        article.content = target_rev.content
        article.save(update_fields=["title", "summary", "content", "updated_at"])

        # Create new revision snapshot to preserve non-destructive linear history
        new_rev = article.create_revision(
            author=user,
            change_summary=change_summary,
            is_restoration=True,
            restored_from_revision=target_rev.revision_number,
        )

        log_audit_event(
            action=AuditEvent.Action.ARTICLE_RESTORE,
            resource_type="article",
            actor=user,
            resource_id=article.id,
            resource_name=article.title,
            details={
                "slug": article.slug,
                "restored_from_revision": target_rev.revision_number,
                "new_revision_number": new_rev.revision_number,
                "reason": reason,
            },
            request=request,
        )

        return Response(
            {
                "detail": f"Article '{article.title}' successfully restored from Revision #{target_rev.revision_number}.",
                "restored_from_revision": target_rev.revision_number,
                "new_revision_number": new_rev.revision_number,
                "article": ArticleDetailSerializer(article).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def feedback(self, request, slug=None):
        """
        Submit reader feedback (👍 or 👎) with optional constructive notes for authors.
        POST /api/v1/articles/{slug}/feedback/
        """
        article = self.get_object()
        is_helpful = request.data.get("is_helpful")
        if is_helpful is None:
            return Response(
                {"detail": "Field 'is_helpful' (boolean) is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = str(request.data.get("note", "")).strip()[:1000]

        feedback_obj, created = ArticleFeedback.objects.update_or_create(
            article=article,
            user=request.user,
            defaults={
                "is_helpful": bool(is_helpful),
                "note": note,
            },
        )

        log_audit_event(
            action=AuditEvent.Action.ARTICLE_UPDATE,
            resource_type="article_feedback",
            actor=request.user,
            resource_id=feedback_obj.id,
            resource_name=f"Feedback on {article.title}",
            details={
                "slug": article.slug,
                "is_helpful": feedback_obj.is_helpful,
                "has_note": bool(note),
            },
            request=request,
        )

        return Response(
            {
                "detail": "Feedback recorded successfully. Thank you!",
                "feedback": {
                    "id": str(feedback_obj.id),
                    "is_helpful": feedback_obj.is_helpful,
                    "note": feedback_obj.note,
                    "updated_at": feedback_obj.updated_at.isoformat(),
                },
                "helpful_count": article.helpful_count,
                "unhelpful_count": article.unhelpful_count,
                "helpfulness_score": article.helpfulness_score,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="record-view",
        permission_classes=[permissions.IsAuthenticated],
    )
    def record_view(self, request, slug=None):
        """
        Atomically increment the verified view counter for this article.
        POST /api/v1/articles/{slug}/record-view/
        """
        article = self.get_object()
        from django.db.models import F

        Article.objects.filter(id=article.id).update(view_count=F("view_count") + 1)
        article.refresh_from_db(fields=["view_count"])

        try:
            viewer_user = request.user if request.user and request.user.is_authenticated else None
            session_key = getattr(request.session, "session_key", None)
            if not session_key:
                session_key = request.headers.get("X-Session-ID") or None

            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_addr = x_forwarded_for.split(",")[0].strip()
            else:
                ip_addr = request.META.get("REMOTE_ADDR")

            user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
            referrer = request.META.get("HTTP_REFERER", "")[:500]

            ArticleViewLog.objects.create(
                article=article,
                user=viewer_user,
                session_key=session_key,
                ip_address=ip_addr,
                user_agent=user_agent,
                referrer=referrer,
            )
        except Exception:
            pass

        return Response(
            {
                "view_count": article.view_count,
                "slug": article.slug,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def feedbacks(self, request, slug=None):
        """
        Retrieve all feedback entries and constructive notes for authors and reviewers.
        GET /api/v1/articles/{slug}/feedbacks/
        """
        article = self.get_object()
        user = request.user
        if not (user.is_admin or getattr(user, "role", None) in ["REVIEWER"] or article.author == user):
            return Response(
                {"detail": "You do not have permission to inspect reader feedback notes for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from apps.articles.serializers import ArticleFeedbackSerializer

        feedbacks_qs = article.feedback_entries.select_related("user").order_by("-created_at")
        serializer = ArticleFeedbackSerializer(feedbacks_qs, many=True)
        return Response(
            {
                "count": feedbacks_qs.count(),
                "helpful_count": article.helpful_count,
                "unhelpful_count": article.unhelpful_count,
                "helpfulness_score": article.helpfulness_score,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    @action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticated])
    def comments(self, request, slug=None):
        """
        List comments or post a new collaboration comment on this article.
        GET /api/v1/articles/{slug}/comments/
        POST /api/v1/articles/{slug}/comments/
        Supports @username mentions which automatically notify mentioned users.
        """
        article = self.get_object()

        if request.method == "GET":
            comments_qs = ArticleComment.objects.filter(article=article).select_related("author").order_by("created_at")
            serializer = ArticleCommentSerializer(comments_qs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == "POST":
            content = request.data.get("content", "").strip()
            if not content:
                return Response({"detail": "Comment content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

            comment = ArticleComment.objects.create(
                article=article,
                author=request.user,
                content=content,
            )

            # 1. Parse and notify @mentions
            parse_and_notify_mentions(
                text=content,
                actor=request.user,
                link=f"/articles/{article.slug}#comments",
                article=article,
                custom_title=f"{request.user.full_name or request.user.username} mentioned you in a comment on '{article.title}'",
            )

            # 2. Notify article author if commenter is not author
            if article.author and article.author != request.user:
                Notification.objects.create(
                    recipient=article.author,
                    sender=request.user,
                    notification_type=Notification.NotificationType.COMMENT,
                    title=f"New comment on '{article.title}'",
                    message=f"{request.user.full_name or request.user.username}: \"{content[:140]}\"",
                    link=f"/articles/{article.slug}#comments",
                    article=article,
                )

            serializer = ArticleCommentSerializer(comment, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, slug=None):
        """
        Toggle or update bookmark status on an article for the authenticated user.
        Accepts optional 'action' ('toggle', 'add', 'remove'), 'collection_name', and 'personal_note'.
        """
        article = self.get_object()
        user = request.user
        action_type = request.data.get("action")
        collection_name = request.data.get("collection_name", "Favorites")
        if isinstance(collection_name, str):
            collection_name = collection_name.strip() or "Favorites"
        else:
            collection_name = "Favorites"
        personal_note = request.data.get("personal_note", "")
        if isinstance(personal_note, str):
            personal_note = personal_note.strip()
        else:
            personal_note = ""

        bookmark = ArticleBookmark.objects.filter(user=user, article=article).first()

        # If user explicitly requested removal
        if action_type == "remove":
            if bookmark:
                bookmark.delete()
            return Response({
                "bookmarked": False,
                "message": f"Removed '{article.title}' from bookmarks.",
            }, status=status.HTTP_200_OK)

        # If bookmark exists and no explicit 'add' or property update was requested, treat as toggle-off
        if bookmark and action_type != "add" and "collection_name" not in request.data and "personal_note" not in request.data:
            bookmark.delete()
            return Response({
                "bookmarked": False,
                "message": f"Removed '{article.title}' from bookmarks.",
            }, status=status.HTTP_200_OK)

        # Update existing or create new bookmark
        if bookmark:
            if "collection_name" in request.data:
                bookmark.collection_name = collection_name
            if "personal_note" in request.data:
                bookmark.personal_note = personal_note
            bookmark.save()
            serializer = ArticleBookmarkSerializer(bookmark, context={"request": request})
            return Response({
                "bookmarked": True,
                "message": "Bookmark updated.",
                "bookmark": serializer.data,
            }, status=status.HTTP_200_OK)
        else:
            bookmark = ArticleBookmark.objects.create(
                user=user,
                article=article,
                collection_name=collection_name,
                personal_note=personal_note,
            )
            serializer = ArticleBookmarkSerializer(bookmark, context={"request": request})
            return Response({
                "bookmarked": True,
                "message": f"Added '{article.title}' to {collection_name}.",
                "bookmark": serializer.data,
            }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="bookmark-status", permission_classes=[permissions.IsAuthenticated])
    def bookmark_status(self, request, slug=None):
        """
        Check if the current authenticated user has bookmarked this article.
        """
        article = self.get_object()
        bookmark = ArticleBookmark.objects.filter(user=request.user, article=article).first()
        if bookmark:
            serializer = ArticleBookmarkSerializer(bookmark, context={"request": request})
            return Response({"bookmarked": True, "bookmark": serializer.data}, status=status.HTTP_200_OK)
        return Response({"bookmarked": False, "bookmark": None}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def bookmarks(self, request):
        """
        List all saved bookmarks for the authenticated user with optional collection filtering and search.
        """
        collection = request.query_params.get("collection")
        search = request.query_params.get("search")
        qs = ArticleBookmark.objects.filter(user=request.user).select_related(
            "article", "article__author", "article__category"
        )

        if collection and collection.lower() != "all":
            qs = qs.filter(collection_name__iexact=collection.strip())

        if search:
            search_term = search.strip()
            qs = qs.filter(
                models.Q(article__title__icontains=search_term) |
                models.Q(article__summary__icontains=search_term) |
                models.Q(personal_note__icontains=search_term)
            )

        bookmarks = qs.order_by("-created_at")
        serializer = ArticleBookmarkSerializer(bookmarks, many=True, context={"request": request})

        user_collections = list(
            ArticleBookmark.objects.filter(user=request.user)
            .values_list("collection_name", flat=True)
            .distinct()
        )
        if "Favorites" not in user_collections:
            user_collections.insert(0, "Favorites")

        return Response({
            "count": len(serializer.data),
            "results": serializer.data,
            "collections": user_collections,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="checklist-progress", permission_classes=[permissions.IsAuthenticated])
    def checklist_progress(self, request, slug=None):
        """
        Retrieve the current user's checklist progress for this article.
        GET /api/v1/articles/{slug}/checklist-progress/
        """
        article = self.get_object()
        progress = ArticleChecklistProgress.objects.filter(user=request.user, article=article).first()
        if progress:
            serializer = ArticleChecklistProgressSerializer(progress)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {
                "id": None,
                "article": str(article.id),
                "article_id": str(article.id),
                "article_slug": article.slug,
                "article_title": article.title,
                "checked_items": [],
                "total_items": 0,
                "completed_count": 0,
                "remaining_items": 0,
                "is_completed": False,
                "completion_percentage": 0.0,
                "completed_at": None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="checklist-toggle", permission_classes=[permissions.IsAuthenticated])
    def checklist_toggle(self, request, slug=None):
        """
        Toggle completion status of an individual checklist item.
        POST /api/v1/articles/{slug}/checklist-toggle/
        Payload: { "item_key": string, "is_checked": boolean, "total_items": int (optional) }
        """
        article = self.get_object()
        item_key = str(request.data.get("item_key", "")).strip()
        if not item_key:
            return Response({"detail": "Field 'item_key' is required."}, status=status.HTTP_400_BAD_REQUEST)

        raw_checked = request.data.get("is_checked")
        if raw_checked is None:
            is_checked = True
        elif isinstance(raw_checked, bool):
            is_checked = raw_checked
        elif isinstance(raw_checked, str):
            is_checked = raw_checked.strip().lower() in ("true", "1", "yes")
        else:
            is_checked = bool(raw_checked)

        total_items_in_request = request.data.get("total_items")

        progress, created = ArticleChecklistProgress.objects.get_or_create(
            user=request.user,
            article=article,
            defaults={
                "checked_items": [],
                "total_items": int(total_items_in_request) if total_items_in_request is not None else 0,
            },
        )

        checked_items = list(progress.checked_items) if isinstance(progress.checked_items, list) else []

        if is_checked:
            if item_key not in checked_items:
                checked_items.append(item_key)
        else:
            if item_key in checked_items:
                checked_items.remove(item_key)

        progress.checked_items = checked_items
        progress.completed_count = len(checked_items)

        if total_items_in_request is not None:
            progress.total_items = max(int(total_items_in_request), len(checked_items))
        elif progress.total_items < len(checked_items):
            progress.total_items = len(checked_items)

        if progress.total_items > 0 and progress.completed_count >= progress.total_items:
            progress.is_completed = True
            if not progress.completed_at:
                progress.completed_at = timezone.now()
        else:
            progress.is_completed = False
            progress.completed_at = None

        progress.save()

        serializer = ArticleChecklistProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="checklist-reset", permission_classes=[permissions.IsAuthenticated])
    def checklist_reset(self, request, slug=None):
        """
        Reset all checklist progress for this article back to 0.
        POST /api/v1/articles/{slug}/checklist-reset/
        """
        article = self.get_object()
        progress = ArticleChecklistProgress.objects.filter(user=request.user, article=article).first()
        if progress:
            progress.checked_items = []
            progress.completed_count = 0
            progress.is_completed = False
            progress.completed_at = None
            progress.save()
            serializer = ArticleChecklistProgressSerializer(progress)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {
                "id": None,
                "article": str(article.id),
                "article_id": str(article.id),
                "article_slug": article.slug,
                "article_title": article.title,
                "checked_items": [],
                "total_items": 0,
                "completed_count": 0,
                "remaining_items": 0,
                "is_completed": False,
                "completion_percentage": 0.0,
                "completed_at": None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="my-checklists", permission_classes=[permissions.IsAuthenticated])
    def my_checklists(self, request):
        """
        List all checklist progress records for the current authenticated user.
        GET /api/v1/articles/my-checklists/
        Optional query parameter: ?filter=all|in_progress|completed
        """
        filter_type = str(request.query_params.get("filter", "all")).lower().strip()
        qs = ArticleChecklistProgress.objects.filter(
            user=request.user
        ).select_related("article", "article__category", "article__author")

        if filter_type == "completed":
            qs = qs.filter(is_completed=True)
        elif filter_type == "in_progress":
            qs = qs.filter(is_completed=False, completed_count__gt=0)

        qs = qs.order_by("-updated_at")
        serializer = ArticleChecklistProgressSerializer(qs, many=True)
        return Response(
            {
                "count": qs.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="team-checklist-status",
        permission_classes=[permissions.IsAuthenticated],
    )
    def team_checklist_status(self, request, slug=None):
        """
        Compliance audit report showing checklist progress across all team members for this SOP.
        GET /api/v1/articles/{slug}/team-checklist-status/
        Authorized for: Admins, Reviewers, and the article author.
        """
        article = self.get_object()
        user = request.user
        if not (user.is_admin or getattr(user, "role", None) in ["REVIEWER"] or article.author == user):
            return Response(
                {"detail": "You do not have permission to inspect team compliance for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from apps.accounts.models import CustomUser

        all_users = CustomUser.objects.filter(is_active=True).order_by("role", "full_name")
        progress_map = {
            p.user_id: p
            for p in ArticleChecklistProgress.objects.filter(article=article).select_related("user")
        }

        total_checklist_items = 0
        for p in progress_map.values():
            if p.total_items > 0:
                total_checklist_items = p.total_items
                break
        if total_checklist_items == 0:
            total_checklist_items = sum(
                1 for line in article.content.splitlines() if line.strip().startswith(("- [", "* ["))
            )

        members_data = []
        completed_count = 0
        in_progress_count = 0
        not_started_count = 0

        for u in all_users:
            p = progress_map.get(u.id)
            if p:
                u_completed = p.completed_count
                u_total = p.total_items or total_checklist_items
                u_pct = p.completion_percentage
                u_is_completed = p.is_completed
                u_completed_at = p.completed_at.isoformat() if p.completed_at else None
                u_updated_at = p.updated_at.isoformat() if p.updated_at else None
            else:
                u_completed = 0
                u_total = total_checklist_items
                u_pct = 0.0
                u_is_completed = False
                u_completed_at = None
                u_updated_at = None

            if u_is_completed:
                completed_count += 1
                status_label = "completed"
            elif u_completed > 0:
                in_progress_count += 1
                status_label = "in_progress"
            else:
                not_started_count += 1
                status_label = "not_started"

            members_data.append(
                {
                    "user_id": str(u.id),
                    "username": u.username,
                    "full_name": u.full_name or u.username,
                    "email": u.email,
                    "role": u.role,
                    "status": status_label,
                    "completed_count": u_completed,
                    "total_items": u_total,
                    "completion_percentage": u_pct,
                    "is_completed": u_is_completed,
                    "completed_at": u_completed_at,
                    "updated_at": u_updated_at,
                }
            )

        total_assigned = len(members_data)
        compliance_rate = (
            round((completed_count / total_assigned * 100), 1) if total_assigned > 0 else 0.0
        )

        return Response(
            {
                "article_id": str(article.id),
                "article_slug": article.slug,
                "article_title": article.title,
                "total_items": total_checklist_items,
                "stats": {
                    "total_assigned": total_assigned,
                    "completed_count": completed_count,
                    "in_progress_count": in_progress_count,
                    "not_started_count": not_started_count,
                    "compliance_rate": compliance_rate,
                },
                "members": members_data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="checklist-certificate",
        permission_classes=[permissions.IsAuthenticated],
    )
    def checklist_certificate(self, request, slug=None):
        """
        Retrieve verified compliance certificate metadata for an authenticated user who completed an SOP runbook.
        GET /api/v1/articles/{slug}/checklist-certificate/
        """
        article = self.get_object()
        progress = ArticleChecklistProgress.objects.filter(user=request.user, article=article).first()
        if not progress or not progress.is_completed:
            return Response(
                {"detail": "Verification certificate is only available once all SOP steps are 100% completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import hashlib

        hash_input = f"{request.user.id}:{article.id}:{progress.completed_at}"
        verification_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()[:16].upper()
        cert_id = f"CW-SOP-{verification_hash[:8]}"
        formatted_code = f"{verification_hash[:4]}-{verification_hash[4:8]}-{verification_hash[8:12]}-{verification_hash[12:16]}"

        return Response(
            {
                "certificate_id": cert_id,
                "verification_code": formatted_code,
                "recipient_name": request.user.full_name or request.user.username,
                "recipient_email": request.user.email,
                "recipient_role": request.user.role,
                "article_id": str(article.id),
                "article_slug": article.slug,
                "article_title": article.title,
                "completed_steps": progress.completed_count,
                "total_steps": progress.total_items,
                "completed_at": progress.completed_at.isoformat()
                if progress.completed_at
                else timezone.now().isoformat(),
                "issuer": "Company Wiki Enterprise Compliance Bureau",
                "issuer_seal": "VERIFIED & AUDIT SIGNED",
                "status": "VALID",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="analytics/views-timeline",
        permission_classes=[permissions.IsAuthenticated],
    )
    def views_timeline(self, request, slug=None):
        """
        Deep Article Analytics: Time-series views and reader engagement metrics.
        GET /api/v1/articles/{slug}/analytics/views-timeline/?range=7d|30d|90d
        Permission: Author of the article, Admins, or Reviewers.
        """
        article = self.get_object()

        # Permission verification: Author or Admin/Reviewer
        is_author = article.author_id == request.user.id
        is_admin_or_reviewer = request.user.role in ["ADMIN", "REVIEWER"]
        if not (is_author or is_admin_or_reviewer):
            return Response(
                {"detail": "You do not have permission to view analytics for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        range_param = request.query_params.get("range", "7d").lower()
        if range_param == "90d":
            days = 90
        elif range_param == "30d":
            days = 30
        else:
            range_param = "7d"
            days = 7

        now = timezone.now()
        start_date = (now - datetime.timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
        previous_period_start = start_date - datetime.timedelta(days=days)

        # 1. Query logs in current period
        view_logs = ArticleViewLog.objects.filter(
            article=article,
            viewed_at__gte=start_date,
            viewed_at__lte=now,
        )

        # 2. Query logs in previous period for growth rate calculation
        previous_view_logs = ArticleViewLog.objects.filter(
            article=article,
            viewed_at__gte=previous_period_start,
            viewed_at__lt=start_date,
        )
        previous_total_views = previous_view_logs.count()

        # Build continuous daily timeline
        timeline_map = {}
        for i in range(days):
            current_day = (start_date + datetime.timedelta(days=i)).date()
            day_str = current_day.isoformat()
            timeline_map[day_str] = {
                "date": day_str,
                "label": current_day.strftime("%b %d"),
                "day_name": current_day.strftime("%a"),
                "total_views": 0,
                "unique_users": set(),
                "unique_sessions": set(),
                "unique_ips": set(),
            }

        for log in view_logs:
            day_str = log.viewed_at.date().isoformat()
            if day_str in timeline_map:
                timeline_map[day_str]["total_views"] += 1
                if log.user_id:
                    timeline_map[day_str]["unique_users"].add(log.user_id)
                elif log.session_key:
                    timeline_map[day_str]["unique_sessions"].add(log.session_key)
                elif log.ip_address:
                    timeline_map[day_str]["unique_ips"].add(log.ip_address)

        timeline_data = []
        period_total_views = 0
        peak_views = 0
        peak_date = None
        period_all_users = set()
        period_all_sessions = set()
        period_all_ips = set()

        for day_str in sorted(timeline_map.keys()):
            info = timeline_map[day_str]
            day_views = info["total_views"]
            day_uniques = len(info["unique_users"]) + len(info["unique_sessions"]) + (len(info["unique_ips"]) if not info["unique_sessions"] else 0)
            if day_uniques == 0 and day_views > 0:
                day_uniques = day_views

            period_total_views += day_views
            period_all_users.update(info["unique_users"])
            period_all_sessions.update(info["unique_sessions"])
            period_all_ips.update(info["unique_ips"])

            if day_views > peak_views:
                peak_views = day_views
                peak_date = day_str

            timeline_data.append({
                "date": day_str,
                "label": info["label"],
                "day_name": info["day_name"],
                "total_views": day_views,
                "unique_readers": day_uniques,
            })

        period_unique_readers = len(period_all_users) + len(period_all_sessions) + (len(period_all_ips) if not period_all_sessions else 0)
        if period_unique_readers == 0 and period_total_views > 0:
            period_unique_readers = min(period_total_views, max(1, period_total_views // 2))

        # Growth rate %: ((current - previous) / previous) * 100
        if previous_total_views > 0:
            growth_rate = round(((period_total_views - previous_total_views) / previous_total_views) * 100, 1)
        elif period_total_views > 0:
            growth_rate = 100.0
        else:
            growth_rate = 0.0

        avg_daily = round(period_total_views / days, 1) if days > 0 else 0.0

        return Response(
            {
                "article_slug": article.slug,
                "article_title": article.title,
                "range": range_param,
                "days_count": days,
                "summary": {
                    "period_total_views": period_total_views,
                    "all_time_views": article.view_count,
                    "unique_readers": period_unique_readers,
                    "peak_day_views": peak_views,
                    "peak_day_date": peak_date or (timeline_data[-1]["date"] if timeline_data else None),
                    "average_daily_views": avg_daily,
                    "growth_rate_percentage": growth_rate,
                    "previous_period_views": previous_total_views,
                },
                "timeline": timeline_data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="analytics/sentiment",
        permission_classes=[permissions.IsAuthenticated],
    )
    def sentiment(self, request, slug=None):
        """
        Deep Article Analytics: Reader Sentiment & Helpful vs Unhelpful breakdown.
        GET /api/v1/articles/{slug}/analytics/sentiment/
        Permission: Author of the article, Admins, or Reviewers.
        """
        article = self.get_object()

        # Permission verification: Author or Admin/Reviewer
        is_author = article.author_id == request.user.id
        is_admin_or_reviewer = request.user.role in ["ADMIN", "REVIEWER"]
        if not (is_author or is_admin_or_reviewer):
            return Response(
                {"detail": "You do not have permission to view sentiment analytics for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        feedbacks = ArticleFeedback.objects.filter(article=article).select_related("user").order_by("-created_at")
        total_feedback = feedbacks.count()
        helpful_count = feedbacks.filter(is_helpful=True).count()
        unhelpful_count = feedbacks.filter(is_helpful=False).count()

        if total_feedback > 0:
            helpfulness_score = round((helpful_count / total_feedback) * 100)
        else:
            helpfulness_score = article.helpfulness_score if article.helpfulness_score is not None else 100

        # Quality Health Indicator
        if total_feedback == 0:
            health_status = "NO_DATA"
            health_label = "No Reader Ratings Yet"
            health_description = "Share this article with team members to begin collecting quality and helpfulness feedback."
        elif helpfulness_score >= 80:
            health_status = "HEALTHY"
            health_label = "High Quality Guide"
            health_description = "Readers find this documentation clear, actionable, and accurate with high satisfaction."
        elif helpfulness_score >= 70:
            health_status = "MODERATE"
            health_label = "Adequate Quality"
            health_description = "The majority of readers found it helpful, though minor clarifications or updates may be needed."
        else:
            health_status = "NEEDS_REVIEW"
            health_label = "Needs Review & Revision"
            health_description = "Multiple team members reported issues, outdated commands, or unclear instructions."

        # Feedback rate: % of total article views that left ratings
        total_views = max(1, article.view_count)
        feedback_rate = round((total_feedback / total_views) * 100, 1)

        # Keyword-based / sentiment tag classification
        category_counts = {
            "Clear & Actionable": 0,
            "Accurate & Complete": 0,
            "Well Structured": 0,
            "General Positive": 0,
            "Needs Improvement": 0,
            "Outdated Information": 0,
            "Missing Prerequisite": 0,
            "Confusing Explanation": 0,
            "General Critical": 0,
        }

        recent_feedbacks_data = []
        for fb in feedbacks:
            note_lower = (fb.note or "").lower()
            tag = ""
            if fb.is_helpful:
                if any(k in note_lower for k in ["clear", "easy", "action", "step", "smooth", "great"]):
                    tag = "Clear & Actionable"
                elif any(k in note_lower for k in ["accurate", "complete", "correct", "perfect", "worked"]):
                    tag = "Accurate & Complete"
                elif any(k in note_lower for k in ["structure", "format", "diagram", "organized"]):
                    tag = "Well Structured"
                else:
                    tag = "General Positive"
            else:
                if any(k in note_lower for k in ["outdated", "old", "deprecate", "version", "syntax"]):
                    tag = "Outdated Information"
                elif any(k in note_lower for k in ["miss", "prereq", "depend", "require", "lack"]):
                    tag = "Missing Prerequisite"
                elif any(k in note_lower for k in ["confus", "unclear", "hard", "what", "complex"]):
                    tag = "Confusing Explanation"
                elif any(k in note_lower for k in ["improve", "better", "fix", "update"]):
                    tag = "Needs Improvement"
                else:
                    tag = "General Critical"

            category_counts[tag] += 1

            user_name = "Anonymous Reader"
            user_email = ""
            user_role = "READER"
            user_initial = "R"
            if fb.user:
                user_name = getattr(fb.user, "full_name", "") or fb.user.username
                user_email = fb.user.email
                user_role = getattr(fb.user, "role", "READER")
                user_initial = user_name[0].upper() if user_name else "U"

            recent_feedbacks_data.append({
                "id": str(fb.id),
                "is_helpful": fb.is_helpful,
                "note": fb.note or ("Rated as helpful." if fb.is_helpful else "Rated as unhelpful."),
                "sentiment_tag": tag,
                "user_name": user_name,
                "user_email": user_email,
                "user_role": user_role,
                "user_initial": user_initial,
                "created_at": fb.created_at.isoformat(),
            })

        categories_breakdown = []
        for cat_name, count in category_counts.items():
            if count > 0:
                is_positive = cat_name in ["Clear & Actionable", "Accurate & Complete", "Well Structured", "General Positive"]
                categories_breakdown.append({
                    "category": cat_name,
                    "sentiment": "positive" if is_positive else "negative",
                    "count": count,
                    "percentage": round((count / total_feedback) * 100) if total_feedback > 0 else 0,
                })

        categories_breakdown.sort(key=lambda x: x["count"], reverse=True)

        return Response(
            {
                "article_slug": article.slug,
                "article_title": article.title,
                "summary": {
                    "total_feedback_count": total_feedback,
                    "helpful_count": helpful_count,
                    "unhelpful_count": unhelpful_count,
                    "helpfulness_score": helpfulness_score,
                    "health_status": health_status,
                    "health_label": health_label,
                    "health_description": health_description,
                    "feedback_rate_percentage": feedback_rate,
                },
                "categories_breakdown": categories_breakdown,
                "recent_feedbacks": recent_feedbacks_data[:50],
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="analytics/ping-engagement",
        permission_classes=[permissions.AllowAny],
    )
    def ping_engagement(self, request, slug=None):
        """
        Record real-time reader engagement ping (active reading seconds and scroll depth).
        POST /api/v1/articles/{slug}/analytics/ping-engagement/
        Payload: { session_id: str, active_seconds: int, scroll_percentage: int }
        """
        article = self.get_object()
        session_id = request.data.get("session_id")
        if not session_id:
            return Response(
                {"detail": "Field 'session_id' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            active_seconds = int(request.data.get("active_seconds", 0) or 0)
        except (ValueError, TypeError):
            active_seconds = 0

        try:
            scroll_percent = int(request.data.get("scroll_percentage", request.data.get("scroll_depth_percent", 0)) or 0)
        except (ValueError, TypeError):
            scroll_percent = 0

        scroll_percent = max(0, min(100, scroll_percent))
        active_seconds = max(0, min(86400, active_seconds))

        user = request.user if request.user and request.user.is_authenticated else None

        session_obj, created = ArticleEngagementSession.objects.get_or_create(
            article=article,
            session_id=str(session_id)[:64],
            defaults={
                "user": user,
                "active_seconds": active_seconds,
                "scroll_depth_percent": scroll_percent,
                "reached_25": scroll_percent >= 25,
                "reached_50": scroll_percent >= 50,
                "reached_75": scroll_percent >= 75,
                "reached_100": scroll_percent >= 90,
            },
        )

        if not created:
            updated_fields = ["updated_at"]
            if user and not session_obj.user:
                session_obj.user = user
                updated_fields.append("user")
            if active_seconds > session_obj.active_seconds:
                session_obj.active_seconds = active_seconds
                updated_fields.append("active_seconds")
            if scroll_percent > session_obj.scroll_depth_percent:
                session_obj.scroll_depth_percent = scroll_percent
                updated_fields.append("scroll_depth_percent")

            if session_obj.scroll_depth_percent >= 25 and not session_obj.reached_25:
                session_obj.reached_25 = True
                updated_fields.append("reached_25")
            if session_obj.scroll_depth_percent >= 50 and not session_obj.reached_50:
                session_obj.reached_50 = True
                updated_fields.append("reached_50")
            if session_obj.scroll_depth_percent >= 75 and not session_obj.reached_75:
                session_obj.reached_75 = True
                updated_fields.append("reached_75")
            if session_obj.scroll_depth_percent >= 90 and not session_obj.reached_100:
                session_obj.reached_100 = True
                updated_fields.append("reached_100")

            session_obj.save(update_fields=updated_fields)

        return Response(
            {
                "status": "success",
                "session_id": session_obj.session_id,
                "active_seconds": session_obj.active_seconds,
                "scroll_depth_percent": session_obj.scroll_depth_percent,
                "reached_100": session_obj.reached_100,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="analytics/engagement",
        permission_classes=[permissions.IsAuthenticated],
    )
    def engagement(self, request, slug=None):
        """
        Deep Article Analytics: Reading time and scroll depth drop-off funnel.
        GET /api/v1/articles/{slug}/analytics/engagement/
        Permission: Author of the article, Admins, or Reviewers.
        """
        article = self.get_object()

        is_author = article.author_id == request.user.id
        is_admin_or_reviewer = getattr(request.user, "role", "") in ["ADMIN", "REVIEWER"] or getattr(request.user, "is_admin", False)
        if not (is_author or is_admin_or_reviewer):
            return Response(
                {"detail": "You do not have permission to view engagement metrics for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        sessions_qs = ArticleEngagementSession.objects.filter(article=article)
        total_sessions = sessions_qs.count()

        # Word count and estimated reading time (approx 200 words per minute)
        raw_text = f"{article.title} {article.summary or ''} {article.content or ''}"
        word_count = len(raw_text.split())
        estimated_read_seconds = max(30, round((word_count / 200) * 60))

        def format_duration(seconds):
            if seconds < 60:
                return f"{int(seconds)}s"
            m = int(seconds // 60)
            s = int(seconds % 60)
            return f"{m}m {s}s" if s > 0 else f"{m}m"

        if total_sessions == 0:
            return Response(
                {
                    "article_slug": article.slug,
                    "article_title": article.title,
                    "estimated_read_seconds": estimated_read_seconds,
                    "estimated_read_formatted": format_duration(estimated_read_seconds),
                    "summary": {
                        "total_readers": 0,
                        "avg_read_seconds": 0,
                        "avg_read_formatted": "0s",
                        "completion_rate_percentage": 0,
                        "retention_score": 0,
                        "engagement_level": "No Data Yet",
                        "primary_drop_off_stage": "N/A",
                    },
                    "funnel": [
                        {"stage": "Started (0%)", "milestone": 0, "readers": 0, "percentage": 0, "drop_off_percentage": 0},
                        {"stage": "Quarter Read (25%)", "milestone": 25, "readers": 0, "percentage": 0, "drop_off_percentage": 0},
                        {"stage": "Halfway (50%)", "milestone": 50, "readers": 0, "percentage": 0, "drop_off_percentage": 0},
                        {"stage": "Deep Read (75%)", "milestone": 75, "readers": 0, "percentage": 0, "drop_off_percentage": 0},
                        {"stage": "Completed (100%)", "milestone": 100, "readers": 0, "percentage": 0, "drop_off_percentage": 0},
                    ],
                    "distribution": [
                        {"bucket": "< 30s", "label": "Quick Skimmers", "count": 0, "percentage": 0},
                        {"bucket": "30s - 2m", "label": "Casual Readers", "count": 0, "percentage": 0},
                        {"bucket": "2m - 5m", "label": "Engaged Readers", "count": 0, "percentage": 0},
                        {"bucket": "> 5m", "label": "Deep Focus", "count": 0, "percentage": 0},
                    ],
                    "recommendations": [
                        "Share this article with teammates or post in relevant channels to start collecting engagement data."
                    ],
                },
                status=status.HTTP_200_OK,
            )

        avg_sec = sessions_qs.aggregate(avg=models.Avg("active_seconds"))["avg"] or 0
        avg_active_seconds = round(avg_sec)

        r25 = sessions_qs.filter(reached_25=True).count()
        r50 = sessions_qs.filter(reached_50=True).count()
        r75 = sessions_qs.filter(reached_75=True).count()
        r100 = sessions_qs.filter(reached_100=True).count()

        p0 = 100.0
        p25 = round((r25 / total_sessions) * 100, 1)
        p50 = round((r50 / total_sessions) * 100, 1)
        p75 = round((r75 / total_sessions) * 100, 1)
        p100 = round((r100 / total_sessions) * 100, 1)

        drop_0_25 = round(p0 - p25, 1)
        drop_25_50 = round(p25 - p50, 1)
        drop_50_75 = round(p50 - p75, 1)
        drop_75_100 = round(p75 - p100, 1)

        funnel = [
            {"stage": "Started (0%)", "milestone": 0, "readers": total_sessions, "percentage": p0, "drop_off_percentage": 0.0},
            {"stage": "Quarter Read (25%)", "milestone": 25, "readers": r25, "percentage": p25, "drop_off_percentage": drop_0_25},
            {"stage": "Halfway (50%)", "milestone": 50, "readers": r50, "percentage": p50, "drop_off_percentage": drop_25_50},
            {"stage": "Deep Read (75%)", "milestone": 75, "readers": r75, "percentage": p75, "drop_off_percentage": drop_50_75},
            {"stage": "Completed (100%)", "milestone": 100, "readers": r100, "percentage": p100, "drop_off_percentage": drop_75_100},
        ]

        drops = [
            ("0% - 25% (Introduction)", drop_0_25),
            ("25% - 50% (First Half)", drop_25_50),
            ("50% - 75% (Core Sections)", drop_50_75),
            ("75% - 100% (Conclusion / Runbook)", drop_75_100),
        ]
        drops.sort(key=lambda x: x[1], reverse=True)
        primary_drop = drops[0][0] if drops[0][1] > 5 else "Even Retention"

        c_under_30 = sessions_qs.filter(active_seconds__lt=30).count()
        c_30_120 = sessions_qs.filter(active_seconds__gte=30, active_seconds__lt=120).count()
        c_120_300 = sessions_qs.filter(active_seconds__gte=120, active_seconds__lt=300).count()
        c_over_300 = sessions_qs.filter(active_seconds__gte=300).count()

        distribution = [
            {"bucket": "< 30s", "label": "Quick Skimmers", "count": c_under_30, "percentage": round((c_under_30 / total_sessions) * 100)},
            {"bucket": "30s - 2m", "label": "Casual Readers", "count": c_30_120, "percentage": round((c_30_120 / total_sessions) * 100)},
            {"bucket": "2m - 5m", "label": "Engaged Readers", "count": c_120_300, "percentage": round((c_120_300 / total_sessions) * 100)},
            {"bucket": "> 5m", "label": "Deep Focus", "count": c_over_300, "percentage": round((c_over_300 / total_sessions) * 100)},
        ]

        retention_score = round((p25 * 0.15) + (p50 * 0.25) + (p75 * 0.3) + (p100 * 0.3))
        if retention_score >= 75:
            engagement_level = "Exceptional"
        elif retention_score >= 55:
            engagement_level = "Strong"
        elif retention_score >= 35:
            engagement_level = "Moderate"
        else:
            engagement_level = "Needs Improvement"

        recommendations = []
        if drop_0_25 > 25:
            recommendations.append("High early drop-off: Consider sharpening the summary and placing key takeaways or a TL;DR right at the top.")
        if drop_50_75 > 25:
            recommendations.append("Mid-article drop-off: Add code blocks, visual tables, or subheadings to break up dense paragraphs in the middle.")
        if p100 >= 60:
            recommendations.append("Outstanding completion rate! Over 60% of readers reach the end of this guide.")
        if not recommendations:
            recommendations.append("Engagement is well-balanced across all sections. Keep updating content to maintain high reader retention.")

        return Response(
            {
                "article_slug": article.slug,
                "article_title": article.title,
                "estimated_read_seconds": estimated_read_seconds,
                "estimated_read_formatted": format_duration(estimated_read_seconds),
                "summary": {
                    "total_readers": total_sessions,
                    "avg_read_seconds": avg_active_seconds,
                    "avg_read_formatted": format_duration(avg_active_seconds),
                    "completion_rate_percentage": p100,
                    "retention_score": retention_score,
                    "engagement_level": engagement_level,
                    "primary_drop_off_stage": primary_drop,
                },
                "funnel": funnel,
                "distribution": distribution,
                "recommendations": recommendations,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="analytics/export",
        permission_classes=[permissions.IsAuthenticated],
    )
    def export_analytics(self, request, slug=None):
        """
        One-Click Export Suite: Export unified article analytics report in CSV or JSON format.
        GET /api/v1/articles/{slug}/analytics/export/?format=csv|json
        Permission: Author of the article, Admins, or Reviewers.
        """
        article = self.get_object()

        # Permission verification: Author or Admin/Reviewer
        is_author = article.author_id == request.user.id
        is_admin_or_reviewer = getattr(request.user, "role", "") in ["ADMIN", "REVIEWER"] or getattr(request.user, "is_admin", False)
        if not (is_author or is_admin_or_reviewer):
            return Response(
                {"detail": "You do not have permission to export analytics for this article."},
                status=status.HTTP_403_FORBIDDEN,
            )

        export_format = request.query_params.get("format", "json").lower()
        if export_format not in ["csv", "json"]:
            export_format = "json"

        now = timezone.now()
        timestamp_str = now.strftime("%Y%m%d_%H%M%S")

        # 1. Gather View Logs & 30-Day Timeline
        thirty_days_ago = (now - datetime.timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        logs_qs = ArticleViewLog.objects.filter(article=article)
        total_views = article.view_count
        recent_logs = logs_qs.filter(viewed_at__gte=thirty_days_ago)

        unique_users_count = logs_qs.exclude(user__isnull=True).values("user").distinct().count()
        unique_sessions_count = logs_qs.filter(user__isnull=True).exclude(session_key__isnull=True).values("session_key").distinct().count()
        total_unique_readers = unique_users_count + unique_sessions_count
        if total_unique_readers == 0 and total_views > 0:
            total_unique_readers = max(1, round(total_views * 0.65))

        daily_timeline = []
        for i in range(30):
            day_date = thirty_days_ago + datetime.timedelta(days=i)
            day_str = day_date.strftime("%Y-%m-%d")
            day_name = day_date.strftime("%A")
            day_logs = recent_logs.filter(viewed_at__date=day_date.date())
            v_count = day_logs.count()
            u_count = day_logs.values("user").distinct().count() + day_logs.filter(user__isnull=True).values("session_key").distinct().count()
            daily_timeline.append({
                "date": day_str,
                "day_name": day_name,
                "total_views": v_count,
                "unique_readers": u_count,
            })

        # 2. Gather Sentiment & Feedbacks
        helpful_count = article.helpful_count
        unhelpful_count = article.unhelpful_count
        total_feedback = helpful_count + unhelpful_count
        helpfulness_score = article.helpfulness_score

        if total_feedback == 0:
            health_status = "NO_DATA"
            health_label = "Awaiting Feedback"
            health_desc = "No reader feedback collected yet."
        elif helpfulness_score >= 80:
            health_status = "HEALTHY"
            health_label = "High Quality Guide"
            health_desc = "Over 80% of readers rated this guide as clear and actionable."
        elif helpfulness_score >= 65:
            health_status = "MODERATE"
            health_label = "Moderate Quality"
            health_desc = "Satisfactory rating; review constructive notes to improve clarity."
        else:
            health_status = "NEEDS_REVIEW"
            health_label = "Needs Review"
            health_desc = "Higher unhelpful ratio; content may be outdated or incomplete."

        feedbacks_qs = article.feedback_entries.select_related("user").order_by("-created_at")
        feedback_items = []
        for fb in feedbacks_qs[:100]:
            u_name = getattr(fb.user, "full_name", "") or (fb.user.username if fb.user else "Anonymous Reader")
            u_role = getattr(fb.user, "role", "READER") if fb.user else "READER"

            note_lower = (fb.note or "").lower()
            if "clear" in note_lower or "easy" in note_lower or "smooth" in note_lower:
                tag = "Clear & Actionable"
            elif "accurate" in note_lower or "complete" in note_lower or "correct" in note_lower:
                tag = "Accurate & Complete"
            elif "outdated" in note_lower or "old" in note_lower or "update" in note_lower:
                tag = "Outdated Info"
            elif "incomplete" in note_lower or "missing" in note_lower:
                tag = "Needs Detail"
            else:
                tag = "General Positive" if fb.is_helpful else "Needs Improvement"

            feedback_items.append({
                "id": str(fb.id),
                "user_name": u_name,
                "user_role": u_role,
                "is_helpful": fb.is_helpful,
                "rating": "Helpful" if fb.is_helpful else "Unhelpful",
                "sentiment_tag": tag,
                "note": fb.note or ("Rated as helpful." if fb.is_helpful else "Rated as unhelpful."),
                "created_at": fb.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        # 3. Gather Engagement & Funnel
        sessions_qs = ArticleEngagementSession.objects.filter(article=article)
        total_sessions = sessions_qs.count()

        raw_text = f"{article.title} {article.summary or ''} {article.content or ''}"
        word_count = len(raw_text.split())
        estimated_read_seconds = max(30, round((word_count / 200) * 60))

        def format_duration(seconds):
            if seconds < 60:
                return f"{int(seconds)}s"
            m = int(seconds // 60)
            s = int(seconds % 60)
            return f"{m}m {s}s" if s > 0 else f"{m}m"

        avg_sec = sessions_qs.aggregate(avg=models.Avg("active_seconds"))["avg"] or 0
        avg_active_seconds = round(avg_sec)

        r25 = sessions_qs.filter(reached_25=True).count()
        r50 = sessions_qs.filter(reached_50=True).count()
        r75 = sessions_qs.filter(reached_75=True).count()
        r100 = sessions_qs.filter(reached_100=True).count()

        if total_sessions > 0:
            p25 = round((r25 / total_sessions) * 100, 1)
            p50 = round((r50 / total_sessions) * 100, 1)
            p75 = round((r75 / total_sessions) * 100, 1)
            p100 = round((r100 / total_sessions) * 100, 1)
            drop_0_25 = round(100.0 - p25, 1)
            drop_25_50 = round(p25 - p50, 1)
            drop_50_75 = round(p50 - p75, 1)
            drop_75_100 = round(p75 - p100, 1)
        else:
            p25 = p50 = p75 = p100 = 0.0
            drop_0_25 = drop_25_50 = drop_50_75 = drop_75_100 = 0.0

        funnel = [
            {"milestone": 0, "stage": "Started (0%)", "readers": total_sessions, "percentage": 100.0 if total_sessions > 0 else 0.0, "drop_off_percentage": 0.0},
            {"milestone": 25, "stage": "Quarter Read (25%)", "readers": r25, "percentage": p25, "drop_off_percentage": drop_0_25},
            {"milestone": 50, "stage": "Halfway (50%)", "readers": r50, "percentage": p50, "drop_off_percentage": drop_25_50},
            {"milestone": 75, "stage": "Deep Read (75%)", "readers": r75, "percentage": p75, "drop_off_percentage": drop_50_75},
            {"milestone": 100, "stage": "Completed (100%)", "readers": r100, "percentage": p100, "drop_off_percentage": drop_75_100},
        ]

        drops = [
            ("0% - 25% (Introduction)", drop_0_25),
            ("25% - 50% (First Half)", drop_25_50),
            ("50% - 75% (Core Sections)", drop_50_75),
            ("75% - 100% (Conclusion / Runbook)", drop_75_100),
        ]
        drops.sort(key=lambda x: x[1], reverse=True)
        primary_drop = drops[0][0] if drops[0][1] > 5 else "Even Retention"

        c_under_30 = sessions_qs.filter(active_seconds__lt=30).count()
        c_30_120 = sessions_qs.filter(active_seconds__gte=30, active_seconds__lt=120).count()
        c_120_300 = sessions_qs.filter(active_seconds__gte=120, active_seconds__lt=300).count()
        c_over_300 = sessions_qs.filter(active_seconds__gte=300).count()

        distribution = [
            {"bucket": "< 30s", "label": "Quick Skimmers", "count": c_under_30, "percentage": round((c_under_30 / total_sessions) * 100) if total_sessions > 0 else 0},
            {"bucket": "30s - 2m", "label": "Casual Readers", "count": c_30_120, "percentage": round((c_30_120 / total_sessions) * 100) if total_sessions > 0 else 0},
            {"bucket": "2m - 5m", "label": "Engaged Readers", "count": c_120_300, "percentage": round((c_120_300 / total_sessions) * 100) if total_sessions > 0 else 0},
            {"bucket": "> 5m", "label": "Deep Focus", "count": c_over_300, "percentage": round((c_over_300 / total_sessions) * 100) if total_sessions > 0 else 0},
        ]

        retention_score = round((p25 * 0.15) + (p50 * 0.25) + (p75 * 0.3) + (p100 * 0.3))
        if retention_score >= 75:
            engagement_level = "Exceptional"
        elif retention_score >= 55:
            engagement_level = "Strong"
        elif retention_score >= 35:
            engagement_level = "Moderate"
        else:
            engagement_level = "Needs Improvement"

        recommendations = []
        if drop_0_25 > 25:
            recommendations.append("High early drop-off: Consider sharpening the summary and placing a TL;DR at the top.")
        if drop_50_75 > 25:
            recommendations.append("Mid-article drop-off: Add code blocks, visual tables, or subheadings in the core sections.")
        if p100 >= 60:
            recommendations.append("Outstanding completion rate! Over 60% of readers reach the end of this guide.")
        if not recommendations:
            recommendations.append("Engagement is well-balanced across all sections. Keep updating content to maintain retention.")

        # 4. Return CSV Format
        if export_format == "csv":
            output = io.StringIO()
            writer = csv.writer(output)

            # UTF-8 BOM for Excel
            output.write("\ufeff")

            # Section 1: Executive Metadata
            writer.writerow(["=== COMPANY WIKI ARTICLE ANALYTICS EXECUTIVE REPORT ==="])
            writer.writerow(["Article Title", article.title])
            writer.writerow(["Article Slug", article.slug])
            writer.writerow(["Category", article.category.name if article.category else "General"])
            writer.writerow(["Author", article.author.username if article.author else "Unknown"])
            writer.writerow(["Exported At (UTC)", now.strftime("%Y-%m-%d %H:%M:%S")])
            writer.writerow(["Exported By", request.user.username])
            writer.writerow([])

            # Section 2: Core KPI Summary
            writer.writerow(["=== KEY PERFORMANCE INDICATORS (KPIs) ==="])
            writer.writerow(["Metric", "Value", "Notes"])
            writer.writerow(["Total All-Time Views", article.view_count, "Cumulative page views"])
            writer.writerow(["Unique Readers", total_unique_readers, "Distinct reader identities & sessions"])
            writer.writerow(["Helpfulness Score", f"{helpfulness_score}%", f"{helpful_count} Helpful vs {unhelpful_count} Unhelpful"])
            writer.writerow(["Quality Health Status", health_label, health_desc])
            writer.writerow(["Average Reading Time", format_duration(avg_active_seconds), f"Estimated read time: {format_duration(estimated_read_seconds)}"])
            writer.writerow(["Completion Rate", f"{p100}%", "Readers who reached 90%+ scroll depth"])
            writer.writerow(["Retention Health Score", f"{retention_score}/100", engagement_level])
            writer.writerow(["Primary Drop-off Stage", primary_drop, "Stage with largest reader drop"])
            writer.writerow([])

            # Section 3: Scroll Depth Funnel
            writer.writerow(["=== READER SCROLL-DEPTH RETENTION FUNNEL ==="])
            writer.writerow(["Milestone", "Stage Name", "Readers Count", "Retention Rate", "Drop-Off From Prior Stage"])
            for st in funnel:
                writer.writerow([f"{st['milestone']}%", st["stage"], st["readers"], f"{st['percentage']}%", f"{st['drop_off_percentage']}%"])
            writer.writerow([])

            # Section 4: Daily Views (30 Days)
            writer.writerow(["=== DAILY VIEWS TIMELINE (LAST 30 DAYS) ==="])
            writer.writerow(["Date", "Day of Week", "Total Views", "Unique Readers"])
            for pt in daily_timeline:
                writer.writerow([pt["date"], pt["day_name"], pt["total_views"], pt["unique_readers"]])
            writer.writerow([])

            # Section 5: Reading Time Distribution
            writer.writerow(["=== READING TIME ATTENTION DISTRIBUTION ==="])
            writer.writerow(["Time Bucket", "Audience Segment", "Reader Count", "Percentage of Readers"])
            for b in distribution:
                writer.writerow([b["bucket"], b["label"], b["count"], f"{b['percentage']}%"])
            writer.writerow([])

            # Section 6: Reader Feedback Notes
            writer.writerow(["=== READER FEEDBACK & SENTIMENT NOTES ==="])
            writer.writerow(["Feedback ID", "Date", "Reader Name", "Role", "Rating", "Sentiment Category", "Constructive Note"])
            for fb in feedback_items:
                writer.writerow([fb["id"], fb["created_at"], fb["user_name"], fb["user_role"], fb["rating"], fb["sentiment_tag"], fb["note"]])

            csv_data = output.getvalue()
            filename = f"analytics_{article.slug}_{timestamp_str}.csv"
            response = HttpResponse(csv_data, content_type="text/csv; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response

        # 5. Return JSON Format
        payload = {
            "metadata": {
                "article_title": article.title,
                "article_slug": article.slug,
                "category": article.category.name if article.category else "General",
                "author": article.author.username if article.author else "Unknown",
                "exported_at": now.isoformat(),
                "exported_by": request.user.username,
                "report_version": "1.0",
            },
            "executive_kpis": {
                "all_time_views": article.view_count,
                "unique_readers": total_unique_readers,
                "helpfulness_score_percentage": helpfulness_score,
                "helpful_votes": helpful_count,
                "unhelpful_votes": unhelpful_count,
                "health_status": health_status,
                "health_label": health_label,
                "health_description": health_desc,
                "total_reading_sessions": total_sessions,
                "avg_reading_seconds": avg_active_seconds,
                "avg_reading_formatted": format_duration(avg_active_seconds),
                "estimated_read_seconds": estimated_read_seconds,
                "estimated_read_formatted": format_duration(estimated_read_seconds),
                "completion_rate_percentage": p100,
                "retention_score": retention_score,
                "engagement_level": engagement_level,
                "primary_drop_off_stage": primary_drop,
            },
            "scroll_depth_funnel": funnel,
            "daily_views_timeline_30d": daily_timeline,
            "reading_time_distribution": distribution,
            "reader_feedback_notes": feedback_items,
            "optimization_recommendations": recommendations,
        }

        filename = f"analytics_{article.slug}_{timestamp_str}.json"
        response = HttpResponse(
            json.dumps(payload, indent=2, ensure_ascii=False),
            content_type="application/json; charset=utf-8",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(
        detail=True,
        methods=["get"],
        url_path="export",
        permission_classes=[permissions.IsAuthenticated],
    )
    def export_document(self, request, slug=None):
        """
        Multi-Format Export Suite: Export article as Branded PDF, Standalone HTML, ZIP, or Markdown.
        GET /api/v1/articles/{slug}/export/?format=pdf|html|zip|markdown
        """
        article = self.get_object()

        # Enforce visibility rules:
        # If not published, only author, reviewer, or admin can export
        if article.status != Article.Status.PUBLISHED:
            is_author = article.author_id == request.user.id
            is_staff = (
                getattr(request.user, "role", "") in ["ADMIN", "REVIEWER"]
                or getattr(request.user, "is_admin", False)
            )
            if not (is_author or is_staff):
                return Response(
                    {"detail": "You do not have permission to export this non-published article."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        from apps.articles.export_service import ArticleExportService

        fmt = request.query_params.get("format", "markdown")
        return ArticleExportService.export(article, fmt, request)



# Architecture Note: ArticleViewSet enforces RESTful URL patterns with slug lookup.

# Archival Policy: Drafts are purged; active content is soft-archived to protect citations.


class ArticleMediaUploadView(APIView):
    """
    Dedicated endpoint for uploading media assets (diagrams, screenshots, illustrations, attachments)
    supporting drag-and-drop and clipboard paste (Ctrl+V) directly within the Markdown editor.
    URL: POST /api/v1/articles/upload/
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    # Maximum file size: 10 Megabytes
    MAX_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"}
    ALLOWED_DOC_EXTENSIONS = {".pdf", ".drawio", ".json", ".txt", ".md", ".zip"}

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file provided in 'file' multipart payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Size Validation
        if uploaded_file.size > self.MAX_FILE_SIZE:
            size_mb = uploaded_file.size / (1024 * 1024)
            return Response(
                {
                    "error": f"File size ({size_mb:.1f}MB) exceeds the maximum allowed limit of 10MB.",
                    "max_size_bytes": self.MAX_FILE_SIZE,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Extension & Content-Type Sanitization
        filename = uploaded_file.name
        ext = ""
        if "." in filename:
            ext = "." + filename.rsplit(".", 1)[1].lower()

        is_image = ext in self.ALLOWED_IMAGE_EXTENSIONS or (uploaded_file.content_type and uploaded_file.content_type.startswith("image/"))
        if not is_image and ext not in self.ALLOWED_DOC_EXTENSIONS:
            return Response(
                {
                    "error": f"Unsupported file format '{ext}'. Allowed image and diagram formats: {', '.join(sorted(self.ALLOWED_IMAGE_EXTENSIONS | self.ALLOWED_DOC_EXTENSIONS))}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Associate with optional article context if provided
        article = None
        article_id = request.data.get("article_id")
        article_slug = request.data.get("article_slug")
        if article_id:
            try:
                article = Article.objects.get(id=article_id)
            except (Article.DoesNotExist, ValueError):
                pass
        elif article_slug:
            try:
                article = Article.objects.get(slug=article_slug)
            except Article.DoesNotExist:
                pass

        # 4. Create Attachment Record
        attachment = ArticleAttachment.objects.create(
            article=article,
            uploader=request.user if request.user.is_authenticated else None,
            file=uploaded_file,
            original_filename=filename,
            file_size=uploaded_file.size,
            content_type=uploaded_file.content_type or "application/octet-stream",
            is_image=is_image,
        )

        # 5. Audit Logging
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_UPDATE if article else AuditEvent.Action.ARTICLE_CREATE,
            resource_type="article_attachment",
            actor=request.user,
            resource_id=attachment.id,
            resource_name=attachment.original_filename,
            details={
                "original_filename": attachment.original_filename,
                "file_size": attachment.file_size,
                "content_type": attachment.content_type,
                "is_image": attachment.is_image,
                "article_id": str(article.id) if article else None,
                "article_slug": article.slug if article else None,
            },
            request=request,
        )

        serializer = ArticleAttachmentSerializer(attachment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ArticleAttachmentsListView(APIView):
    """
    List all media attachments associated with a given article.
    URL: GET /api/v1/articles/<uuid:article_id>/attachments/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, article_id, *args, **kwargs):
        try:
            article = Article.objects.get(id=article_id)
        except Article.DoesNotExist:
            return Response({"error": "Article not found."}, status=status.HTTP_404_NOT_FOUND)

        attachments = ArticleAttachment.objects.filter(article=article).order_by("-created_at")
        serializer = ArticleAttachmentSerializer(attachments, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

