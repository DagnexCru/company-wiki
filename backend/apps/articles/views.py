import difflib
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.articles.models import Article, ArticleRevision
from apps.articles.permissions import CanCreateArticle, IsAuthorOrAdmin
from apps.articles.serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer,
    ArticleRevisionSerializer,
    ArticleRevisionListSerializer,
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

# Architecture Note: ArticleViewSet enforces RESTful URL patterns with slug lookup.

# Archival Policy: Drafts are purged; active content is soft-archived to protect citations.
